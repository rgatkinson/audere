// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { ChillsModels, defineChillsModels } from "../../models/db/chills";
import { SplitSql } from "../../util/sql";
import { RDTPreview } from "../../external/chillsRDTPreviewClient";
import logger from "../../util/logger";

/**
 * Data access for rdt preview data collected in the Chills project
 */
export class ChillsRDTPreview {
  private readonly models: ChillsModels;

  constructor(sql: SplitSql) {
    this.models = defineChillsModels(sql);
  }

  /**
   * Saves rdt preview series in the database for participants
   *
   * @param rdtPreview List of rdt preview series
   */
  public async importRDTPreviews(rdtPreviews: RDTPreview[]): Promise<void> {
    let succeeded = true;

    for (let i = 0; i < rdtPreviews.length; i++) {
      try {
        await this.models.rdtPreview.upsert(rdtPreviews[i]);
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
