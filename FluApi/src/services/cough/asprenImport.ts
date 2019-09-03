// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { AsprenClient } from "../../external/asprenClient";
import { CoughModels, defineCoughModels } from "../../models/db/cough";
import { SplitSql } from "../../util/sql";
import logger from "../../util/logger";
import sequelize = require("sequelize");

/**
 * Imports ASPREN data into the Cough ecosystem.
 */
export class AsprenImport {
  private readonly aspren: AsprenClient;
  private readonly models: CoughModels;
  private readonly sql: SplitSql;

  constructor(sql: SplitSql, aspren: AsprenClient) {
    this.sql = sql;
    this.models = defineCoughModels(sql);
    this.aspren = aspren;
  }

  /**
   * Retrieve and store ASPREN report data in our database.
   */
  public async importAsprenReports(): Promise<void> {
    const report = await this.aspren.getLatestAsprenReport();

    if (report == null) {
      logger.info(`No ASPREN reports available for processing.`);
      return;
    }

    const processed = await this.models.asprenFile.findAll({
      where: {
        key: report.key,
        hash: report.hash,
      },
    });

    // If the same key and hash are present then we skip the file. If the file
    // has changed the hash should also be updated.
    if (processed.length > 0) {
      logger.warn(
        `Report located at ${report.key} with ETag ${report.hash} ` +
          `has already been processed. Skipping ASPREN import.`
      );
      return;
    }

    logger.info(
      `Importing new report, ${report.key} with hash ${report.hash}.`
    );

    // Within a single transaction:
    // 1. Insert a record for the file we're importing.
    // 2. Upsert records from the report.
    // 3. Remove records from the database that are not in the latest report.
    await this.sql.nonPii.transaction(async t => {
      await this.models.asprenFile.upsert(
        { key: report.key, hash: report.hash },
        { transaction: t }
      );
      logger.debug(`Tracked file from ${report.key}.`);

      let created = 0;
      let updated = 0;

      for (let i = 0; i < report.records.length; i++) {
        const result = await this.models.asprenData.upsert(
          { ...report.records[i] },
          { transaction: t }
        );

        if (result) {
          created++;
        } else {
          updated++;
        }

        logger.debug(
          `Upserted record with barcode ${report.records[i].barcode}.`
        );
      }
      logger.info(
        `Done upserting ASPREN data - created ${created} records, updated ${updated} records.`
      );

      const destroyed = await this.models.asprenData.destroy({
        where: {
          barcode: {
            [sequelize.Op.notIn]: report.records.map(r => r.barcode),
          },
        },
        transaction: t,
      });
      logger.info(`Destroyed ${destroyed} prior rows from ASPREN reports.`);
    });
  }
}
