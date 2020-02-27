// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { ChillsModels, defineChillsModels } from "../../models/db/chills";
import { SplitSql } from "../../util/sql";
import { RDTPreview } from "../../external/chillsRDTPreviewClient";
import logger from "../../util/logger";
import sequelize = require("sequelize");

/**
 * Data access for rdt preview data collected in the Chills project
 */
export class ChillsRDTPreview {
  private readonly models: ChillsModels;
  private readonly sql: SplitSql;

  constructor(sql: SplitSql) {
    this.models = defineChillsModels(sql);
    this.sql = sql;
  }

  /**
   * Saves rdt preview series in the database for participants
   *
   * @param rdtPreview List of rdt preview series
   */
  public async importRDTPreviews(rdt_previews: RDTPreview[]): Promise<void> {
    await this.models.rdtPreview.destroy({
      where: {
        docId: {
          [sequelize.Op.not]: rdt_previews.map(r => r.docId),
        },
      },
    });

    let succeeded = true;

    for (let i = 0; i < rdt_previews.length; i++) {
      try {
        await this.models.rdtPreview.upsert(rdt_previews[i]);
      } catch (e) {
        succeeded = false;
        logger.error(`Error importing rdt preview series with index ${i}: `, e);
      }
    }

    if (!succeeded) {
      throw Error("Not all rdt preview series data was imported successfully");
    }
  }
}
