// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SurveyAttributes } from "../../models/db/fever";
import { PIIInfo } from "audere-lib/feverProtocol";
import { Batch, BatchItem, SurveyBatchDataAccess, BatchItemWithCsruid } from "./surveyBatchData";
import logger from "../../util/logger";

export interface RenderResult {
  report: string;
  discarded: number[];
}

/**
 * Common code for extracting a view of PII survey data from the database and
 * uploading it to an external system.
 */
export abstract class PIIReport<T extends BatchItemWithCsruid, U> {
  private readonly dao: SurveyBatchDataAccess<T>;
  protected abstract report: string;

  constructor(dao: SurveyBatchDataAccess<T>) {
    this.dao = dao;
  }

  /**
   * Generates a report from a fixed batch of survey data. Ensures that the
   * batch is processed by tracking and committing status information about the
   * batch.
   */
  public async generateReport(): Promise<void> {
    logger.info(`[${this.report}] Querying for new batch items`);
    const batch = await this.getBatch();

    if (batch != null) {
      let result: RenderResult;

      if (batch.items != null) {
        logger.info(`[${this.report}] Found batch ${batch.id} with ` +
          `${batch.items.length} items`)
        result = await this.buildReport(batch);

        if (result.report != null) {
          logger.info(`[${this.report}] Writing summarized report`);
          await this.writeReport(batch.id, result.report);
        }
      }

      this.dao.commitUploadedBatch(batch.id, result.discarded || []);
    } else {
      logger.info(`[${this.report}] No new records to process.`);
    }
  }

  /**
   * Converts a batch into a report, returning discarded ids.
   * @param batch Batch items to render into a report.
   */
  abstract async buildReport(batch: Batch<U>): Promise<RenderResult>;

  /**
   * Converts a single record from PII survey data into a batch item.
   * @param item Non-PII tracking data about the record.
   * @param pii PII survey data related to the record.
   */
  abstract transformSurveyData(
    item: T,
    pii: SurveyAttributes<PIIInfo>
  ): U;

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
  public async getBatch(): Promise<Batch<U> | null> {
    const existing: Batch<BatchItem> = await this.dao.getExistingBatch();

    let itemBatch: Batch<T>;
    if (this.isValidBatch(existing)) {
      const items = await this.dao.getExistingItems(existing.items);
      itemBatch = { id: existing.id, items: items };
    } else {
      const items = await this.dao.getNewItems();
      itemBatch = await this.dao.trackBatch(items);
    }

    if (this.isValidBatch(itemBatch)) {
      const outputItems = await this.makeOutput(itemBatch.items);
      return { id: itemBatch.id, items: outputItems };
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
  private async makeOutput(items: T[]): Promise<U[]> {
    const csruids = items.map(i => i.csruid);
    const piiData = await this.dao.getPiiData(csruids);
    const output: Array<U> = [];

    items.forEach(i => {
      const pii = piiData.find(p => p.csruid === i.csruid);

      if (pii != null && pii.survey != null) {
        const item = this.transformSurveyData(i, pii);
        output.push(item);
      } else {
        logger.error(
          `[${this.report}] A completed survey was found without ` +
          `corresponding PII completion data, csruid ${i.csruid}`
        );
      }
    });

    return output;
  }
}
