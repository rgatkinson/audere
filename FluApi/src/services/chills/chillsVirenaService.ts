// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  ChillsModels,
  defineChillsModels,
  VirenaFileAttributes,
  VirenaRecordAttributes,
} from "../../models/db/chills";
import { VirenaClient } from "../../external/virenaClient";
import { SplitSql } from "../../util/sql";
import logger from "../../util/logger";

/**
 * Imports Virena influenza data to Postgres for modeling and analysis
 */
export class ChillsVirenaService {
  private readonly client: VirenaClient;
  private readonly models: ChillsModels;
  private readonly segmentSize: number;
  private readonly sql: SplitSql;

  constructor(sql: SplitSql, client: VirenaClient, segmentSize: number) {
    this.models = defineChillsModels(sql);
    this.sql = sql;
    this.client = client;
    this.segmentSize = segmentSize;
  }

  /**
   * Write Virena data from S3 files to the database.
   *
   * @param progress Function to indicate the request is still alive.
   */
  public async import(progress: () => void): Promise<void> {
    const files = await this.client.listVirenaFiles();
    logger.info(`Listed ${files.length} Virena files from S3`);

    if (files.length === 0) {
      logger.warn("There are no Virena files available in S3");
      return;
    }

    const keys = files.map(f => f.key);

    // This table should not be modified out of process
    const existing = await this.models.virenaFile.findAll({
      where: {
        key: keys,
      },
    });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const match = existing.find(e => e.key === file.key);

      let update: VirenaFileAttributes;

      // Clean up previous version if reloading a file
      if (match != null && match.hash !== file.hash) {
        // This will cascade delete records associated to this file
        await this.models.virenaFile.destroy({
          where: {
            id: match.id,
          },
        });
      }

      if (match == null || match.hash !== file.hash) {
        const f = await this.models.virenaFile.create({
          key: file.key,
          hash: file.hash,
          loaded: false,
        });

        update = {
          id: f.id,
          loaded: false,
          ...file,
        };
      } else if (match.loaded === false) {
        update = {
          id: match.id,
          loaded: false,
          nextRow: match.nextRow,
          ...file,
        };
      }

      if (update != null) {
        logger.info(`Retrieving ${file.key} for update`);
        const records = await this.client.getVirenaRecords(file);
        logger.info(
          `Updating Virena file ${file.key} with ${
            records.records.length
          } total records from row ${update.nextRow || 0}`
        );
        await this.updateFile(progress, update, records.records);
      }
    }
  }

  /**
   * Update file & record data in the database from a single S3 file/key.
   *
   * @param progress Function to indicate the request is still alive.
   * @param file Information about the file being updated.
   * @param records Full set of records in the file.
   */
  private async updateFile(
    progress: () => void,
    file: VirenaFileAttributes,
    records: VirenaRecordAttributes[]
  ): Promise<void> {
    let row = file.nextRow || 0;

    while (row < records.length) {
      logger.info(`Saving segment for ${file.key} starting from row ${row}`);
      progress();
      const segmentRecords = records.slice(row, row + this.segmentSize);

      const dbRecords = segmentRecords.map(r => {
        return {
          fileId: file.id,
          ...r,
        };
      });

      await this.sql.nonPii.transaction(async t => {
        await this.models.virenaRecord.bulkCreate(dbRecords, {
          transaction: t,
        });

        // Update the next row to process and mark the file as loaded when the
        // last segment is saved
        if (row + this.segmentSize >= records.length) {
          await this.models.virenaFile.update(
            {
              loaded: true,
              nextRow: records.length,
            },
            {
              where: { id: file.id },
              transaction: t,
            }
          );
        } else {
          await this.models.virenaFile.update(
            { nextRow: row + this.segmentSize },
            {
              where: { id: file.id },
              transaction: t,
            }
          );
        }

        row += this.segmentSize;
      });
    }
  }
}
