// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SurveyAttributes } from "../../models/fever";
import { PIIInfo } from "audere-lib/feverProtocol";
import { Batch, BatchItem, SurveyBatchDataAccess } from "./surveyBatchData";
import logger from "../../util/logger";

export interface RenderResult {
  report: string;
  discarded: number[];
}

/**
 * Common code for extracting a view of PII survey data from the database and
 * uploading it to an external system.
 */
export abstract class PIIReport<T> {
  private readonly dao: SurveyBatchDataAccess;
  protected abstract report: string;

  constructor(dao: SurveyBatchDataAccess) {
    this.dao = dao;
  }

  /**
   * Generates a report from a fixed batch of survey data. Ensures that the
   * batch is processed by tracking and committing status information about the
   * batch.
   */
  public async generateReport(): Promise<void> {
    logger.info(`[${this.report}] Querying for new batch items`)
    const batch = await this.getBatch();

    if (batch != null) {
      logger.info(`[${this.report}] Found batch ${batch.id} with ` +
        `${batch.items.length} items`)
      const result = await this.buildReport(batch);

      if (result.report != null) {
        logger.info(`[${this.report}] Writing summarized report to S3`)
        await this.writeReport(batch.id, result.report);
      }

      this.dao.commitUploadedBatch(batch.id, result.discarded);
    } else {
      logger.info(`[${this.report}] No new records to process.`)
    }
  }

  /**
   * Converts a batch into a report, returning discarded ids.
   * @param batch Batch items to render into a report.
   */
  abstract async buildReport(batch: Batch<T>): Promise<RenderResult>;

  /**
   * Converts a single record from PII survey data into a batch item.
   * @param item Non-PII tracking data about the record.
   * @param pii PII survey data related to the record.
   */
  abstract transformSurveyData(
    item: BatchItem,
    pii: SurveyAttributes<PIIInfo>
  ): T;

  /**
   * Saves the report in the appropriate location.
   * @param batchId Identifier for the batch being processed.
   * @param rows Formatted string rows that comprise a report.
   */
  abstract async writeReport(batchId: number, report: string): Promise<void>;

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
  private async makeOutput(items: BatchItem[]): Promise<T[]> {
    const csruids = items.map(i => i.csruid);
    const piiData = await this.dao.getPiiData(csruids);
    const output: Array<T> = [];

    items.forEach(i => {
      const pii = piiData.find(p => p.csruid === i.csruid);

      if (pii != null && pii.survey != null) {
        const item = this.transformSurveyData(i, pii);
        output.push(item);
      } else {
        logger.error(
          "A completed survey was found without corresponding PII " +
            "completion data, csruid " +
            i.csruid
        );
      }
    });

    return output;
  }
}
