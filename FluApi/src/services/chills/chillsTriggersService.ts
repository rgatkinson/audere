// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { ChillsModels, defineChillsModels } from "../../models/db/chills";
import { SplitSql } from "../../util/sql";
import { Trigger } from "../../external/evidationTriggersClient";
import logger from "../../util/logger";
import sequelize = require("sequelize");

/**
 * Data access for Evidation trigger to use app in the Chills project
 */
export class ChillsTriggers {
  private readonly models: ChillsModels;
  private readonly sql: SplitSql;

  constructor(sql: SplitSql) {
    this.models = defineChillsModels(sql);
    this.sql = sql;
  }

  /**
   * Saves symptom trigger dates in the database for participants
   *
   * @param triggers List of Evidation IDs and their trigger date
   */
  public async importTriggers(triggers: Trigger[]): Promise<void> {
    await this.models.triggers.destroy({
      where: {
        evidationId: {
          [sequelize.Op.not]: triggers.map(t => t.evidationId),
        },
      },
    });

    let succeeded = true;

    for (let i = 0; i < triggers.length; i++) {
      try {
        await this.models.triggers.upsert(triggers[i]);
      } catch (e) {
        succeeded = false;
        logger.error(`Error importing trigger with index ${i}: `, e);
      }
    }

    if (!succeeded) {
      throw Error("Not all trigger data was imported successfully");
    }
  }
}
