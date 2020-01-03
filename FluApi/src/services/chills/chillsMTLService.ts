// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { ChillsModels, defineChillsModels } from "../../models/db/chills";
import { EvidationMTLClient } from "../../external/evidationMTLClient";
import { SplitSql } from "../../util/sql";
import logger from "../../util/logger";

/**
 * Imports MTL data and order status into the database. Tracks individual files
 * by ETag/hash and compares again a list of available files to determine which
 * files to process.
 */
export class ChillsMTLService {
  private readonly client: EvidationMTLClient;
  private readonly models: ChillsModels;
  private readonly sql: SplitSql;

  constructor(sql: SplitSql, client: EvidationMTLClient) {
    this.models = defineChillsModels(sql);
    this.sql = sql;
    this.client = client;
  }

  public async import(): Promise<void> {
    const files = await this.client.listMTLFiles();
    logger.info(`Listed ${files.length} MTL files from S3`);

    if (files.length === 0) {
      logger.warn("There are no MTL files available in S3");
      return;
    }

    const keys = files.map(f => f.key);

    const existing = await this.models.mtlFiles.findAll({
      where: {
        key: keys,
      },
    });

    const toUpdate = files.filter(f => {
      const match = existing.find(e => e.key === f.key);
      return match == null || match.hash !== f.hash;
    });

    // Our representation of the data updates doesn't have any need for ordering
    // so we don't fail fast. We continue processing files and track whether any
    // have failed.
    let success = true;

    for (let i = 0; i < toUpdate.length; i++) {
      const file = toUpdate[i];

      try {
        const report = await this.client.getMTLReport(file);
        await this.sql.nonPii.transaction(async t => {
          const update = report.records[0].update;
          await this.models.mtlReports.upsert(update.report, {
            transaction: t,
            fields: update.fields,
          });

          await this.models.mtlFiles.upsert(
            {
              ...report.file,
              orderId: update.report.orderId,
              orderState: report.records[0].status,
            },
            { transaction: t }
          );
        });
      } catch (e) {
        logger.error(
          `Unable to process MTL report with key ${file.key} and hash ${file.hash}:`,
          e
        );
        success = false;
      }
    }

    // Fail the job if any files could not be processed
    if (!success) {
      throw Error("Not all MTL reports were successfully processed");
    }
  }
}
