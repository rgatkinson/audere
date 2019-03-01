// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SurveyAttributes } from "../../models/fever";
import { PIIInfo } from "audere-lib/feverProtocol";
import { Batch, BatchItem, SurveyBatchDataAccess } from "./surveyBatchData";
import logger from "../../util/logger";

/**
 * Common code for extracting a view of PII survey data from the database and
 * uploading it to an external system.
 */
export abstract class SurveyBatch<T> {
  private readonly dao: SurveyBatchDataAccess;

  constructor(dao: SurveyBatchDataAccess) {
    this.dao = dao;
  }

  /**
   * Converts a single record from PII survey data into the desired output type.
   * @param item Non-PII tracking data about the record.
   * @param pii PII survey data related to the record.
   */
  abstract mapItem(item: BatchItem, pii: SurveyAttributes<PIIInfo>): T;

  public async commitUploadedBatch(
    batchId: number,
    discarded: number[]
  ): Promise<void> {
    await this.dao.commitUploadedBatch(batchId, discarded);
  }

  /**
   * Gets the next batch to process. Depending on current state this may either
   * be a prior batch that has not completed or a new batch. Only one batch
   * should be active at any given time.
   */
  public async getBatch(): Promise<Batch<T> | null> {
    let batch = await this.getPendingBatch();

    if (!this.isValidBatch(batch)) {
      const newItems = await this.dao.getNewBatchItems();
      batch = await this.dao.trackBatch(newItems);
    }

    if (this.isValidBatch(batch)) {
      const outputItems = await this.makeOutput(batch.items);
      return { id: batch.id, items: outputItems };
    }

    return null;
  }

  private async getPendingBatch(): Promise<Batch<BatchItem> | null> {
    const batch = await this.dao.getExistingBatch();

    if (this.isValidBatch(batch)) {
      return batch;
    }

    return null;
  }

  private isValidBatch<T>(batch: Batch<T>) {
    return batch != null && batch.items != null && batch.items.length > 0;
  }

  /**
   * Receives a set of survey identifiers and converts them into a collection
   * of the output type.
   */
  private async makeOutput(
    items: BatchItem[]
  ): Promise<T[]> {
    const csruids = items.map(i => i.csruid);
    const piiData = await this.dao.getPiiData(csruids);
    const output: Array<T> = [];

    items.forEach(i => {
      const pii = piiData.find(p => p.csruid === i.csruid);

      if (pii != null && pii.survey != null) {
        const item = this.mapItem(i, pii);
        output.push(item);
      } else {
        logger.error(
          "A completed survey was found without corresponding PII " +
          "completion data, csruid " + i.csruid
        );
      }
    })

    return output;
  }
}