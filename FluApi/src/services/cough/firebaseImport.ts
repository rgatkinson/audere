// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { BigQueryTableImporter } from "../../external/bigQuery";
import { CoughModels } from "../../models/db/cough";
import { DataPipelineService } from "../dataPipelineService";
import { SplitSql } from "../../util/sql";
import moment = require("moment");
import logger from "../../util/logger";

/**
 * Imports Firebase data from BigQuery to Postgres for Cough.
 */
export class FirebaseImport {
  private readonly sql: SplitSql;
  private readonly models: CoughModels;
  private readonly bigQuery: BigQueryTableImporter;
  private readonly pipeline: DataPipelineService;

  constructor(
    sql: SplitSql,
    models: CoughModels,
    bigQuery: BigQueryTableImporter,
    pipeline: DataPipelineService
  ) {
    this.sql = sql;
    this.models = models;
    this.bigQuery = bigQuery;
    this.pipeline = pipeline;
  }

  /**
   * Lists new and updated analytics tables to refresh.
   */
  public async findTablesToUpdate(): Promise<Map<string, number>> {
    const now = moment().utc();
    const suffixes = [];

    // Lookback can be moved to request params or configuration
    for (let i = 0; i < 3; i++) {
      suffixes.push(now.format("YYYYMMDD"));
      now.subtract(1, "days");
    }

    const tables = await this.bigQuery.listTables();

    const candidateVersions: Map<string, number> = new Map();
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];

      if (suffixes.some(s => table.endsWith(s))) {
        const metadata = await this.bigQuery.getTableMetadata(table);
        candidateVersions.set(table, +metadata.lastModifiedTime);
      }
    }

    if (candidateVersions.size === 0) {
      throw Error("No tables available over the last three days");
    }

    const candidateKeys = Array.from(candidateVersions.keys());
    logger.info(
      `Checking last modified time for tables ${candidateKeys.join(", ")}`
    );

    const existingVersions = await this.models.firebaseAnalyticsTable.findAll({
      where: {
        name: Array.from(candidateVersions.keys()),
      },
    });

    const toUpdate: Map<string, number> = new Map();
    candidateKeys.forEach(t => {
      const existing = existingVersions.find(v => v.name == t);
      if (existing == null || candidateVersions.get(t) > existing.modified) {
        toUpdate.set(t, candidateVersions.get(t));
      }
    });

    logger.info(
      `Tables ${Array.from(toUpdate.keys()).join(", ")} contain updates`
    );

    return toUpdate;
  }

  /**
   * Imports a list of tables into the database and refreshes derived views
   *
   * @param tableList A map of table id and last modified time
   */
  public async importAnalytics(tableList: Map<string, number>) {
    const tables = Array.from(tableList.keys());

    for (let i = 0; i < tables.length; i++) {
      const name = tables[i];
      logger.info(`Importing data for table ${name}`);

      const eventDate = name.slice(name.length - 8);
      const lastModified = tableList.get(name);

      // This transaction wraps long-running calls to external systems which is
      // not desirable
      await this.sql.nonPii.transaction(async t => {
        logger.info(`Destroying existing rows with event date ${eventDate}`);
        await this.models.firebaseAnalytics.destroy({
          where: {
            event_date: eventDate,
          },
        });

        let token: string;

        // Page through the entire result set and write rows to the db
        do {
          logger.info(
            `Fetching table rows for table ${name} with token ${token}`
          );
          const analytics = await this.bigQuery.getTableRows(name, token);

          token = analytics.token;
          const rows = analytics.results.map(r => ({
            event_date: eventDate,
            event: r,
          }));

          logger.info(`Creating ${rows.length} analytic events`);
          await this.models.firebaseAnalytics.bulkCreate(rows, {
            transaction: t,
          });
        } while (token != null);

        // Mark the modified time so we know when the table has been updated
        logger.info(`Setting modified time for ${name} to ${lastModified}`);
        await this.models.firebaseAnalyticsTable.upsert(
          {
            name: name,
            modified: lastModified,
          },
          {
            transaction: t,
          }
        );
      });
    }

    // Update derived views
    logger.info("Refreshing derived views");
    await this.pipeline.refresh();
    logger.info("Refresh complete");
  }
}
