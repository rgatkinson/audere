// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Model, SplitSql } from "../../util/sql";
import {
  SurveyAttributes,
  BatchAttributes,
  BatchItemAttributes,
  BatchDiscardAttributes
} from "../../models/db/fever";
import { PIIInfo } from "audere-lib/feverProtocol";
import Sequelize from "sequelize";
import {
  GaplessSeqAttributes,
  defineGaplessSeq
} from "../../models/db/gaplessSeq";
import logger from "../../util/logger";

/**
 * A resource tracked as a batch with a consistent id and set of items.
 */
export interface Batch<T> {
  id: number;
  items: T[];
}

/**
 * Fever survey batch item descriptor.
 *
 * `workflowId` is a unique, monotonically increasing numeric id within a given
 * sequence or workflow that is dense and can be used within transactions to
 * preserve the sequence ordering in case of rollback.
 */
export interface BatchItem {
  workflowId?: number;
  surveyId: number;
}

/**
 * Forces inclusion of a csruid so we can join across PII & non-PII data.
 */
export interface BatchItemWithCsruid extends BatchItem {
  csruid: string;
}

/**
 * Accessor for a batch of PII survey data. Explicitly tracks each batch and
 * whether it was processed within a given namespace. Each namespace has a
 * unique mapping of survey ids to batches, referred to as a `workflowId`.
 *
 * Each batch has a boolean flag for `uploaded` signifying its status. Each
 * workflow id is seeded from a transaction with a sequence table on batch
 * creation.
 */
export abstract class SurveyBatchDataAccess<T extends BatchItem> {
  protected readonly sql: SplitSql;
  protected readonly gaplessSeq: Model<GaplessSeqAttributes>;
  protected readonly batchModel: Model<BatchAttributes>;
  protected readonly itemModel: Model<BatchItemAttributes>;
  protected readonly discardModel: Model<BatchDiscardAttributes>;

  // Namespaces for batch id and for items within a batch.
  protected readonly abstract batchSeq: string;
  protected readonly abstract itemSeq: string;

  constructor(
    sql: SplitSql,
    gaplessSeq: Model<GaplessSeqAttributes>,
    batchModel: Model<BatchAttributes>,
    itemModel: Model<BatchItemAttributes>,
    discardModel: Model<BatchDiscardAttributes>
  ) {
    this.sql = sql;
    this.gaplessSeq = gaplessSeq;
    this.batchModel = batchModel;
    this.itemModel = itemModel;
    this.discardModel = discardModel;

    this.batchModel.hasMany(this.itemModel, {
      foreignKey: "batchId",
      as: "items",
      onDelete: "CASCADE"
    });
  }

  /**
   * Changes the status of the batch to uploaded. After a batch is uploaded it
   * will not be retried.
   *
   * Also tracks discarded batch items in the database so that we retain a
   * record of the attempt to process and subsequent problem to aid in
   * re-processing or investigation without retrying the entire batch.
   */
  public async commitUploadedBatch(
    batchId: number,
    discarded: number[]
  ): Promise<void> {
    await this.sql.nonPii.transaction(async t => {
      const updated = await this.batchModel.update(
        { uploaded: true },
        { where: { id: batchId }, transaction: t }
      );

      if (updated[0] !== 1) {
        throw Error(
          updated[0] + " rows updated when committing a batch, 1 expected."
        );
      }

      if (discarded != null && discarded.length > 0) {
        const inserts = discarded.map(id => ({
          batchId: batchId,
          workflowId: id
        }));

        await this.discardModel.bulkCreate(inserts, { transaction: t });
      }
    });
  }

  /**
   * Get the lowest existing batch that has not been uploaded. Returns
   * `null` if there are no pending batches.
   */
  public async getExistingBatch(): Promise<Batch<BatchItem> | null> {
    interface HasBatchItems {
      items: BatchItemAttributes[];
    }

    const data = await this.batchModel.find({
      where: {
        uploaded: false
      },
      include: [
        {
          model: this.itemModel,
          as: "items",
          attributes: ["id", "surveyId"]
        }
      ],
      order: [["id", "ASC"]]
    });

    if (data != null) {
      const queryResult = <BatchAttributes & HasBatchItems>(<any>data);

      const batchId = queryResult.id;

      const batchItems: BatchItem[] = queryResult.items.map(i => ({
        workflowId: i.id,
        surveyId: i.surveyId
      }));

      return { id: batchId, items: batchItems };
    } else {
      logger.debug("No prior batches to process");
    }

    return null;
  }

  /**
   * Retrieves surveys which have been associated to a prior batch as a
   * collection of `BatchItem`. Returns `null` if there are no valid surveys to
   * process within that batch.
   */
  public abstract getExistingItems(items: BatchItem[]): Promise<T[] | null>;

  /**
   * Retrieves surveys which have not been associated to any prior batch as a
   * collection of `BatchItem`. Returns `null` if there are no new surveys to
   * process.
   */
  public abstract getNewItems(): Promise<T[] | null>;

  /**
   * Retrieves full PII survey record for a given set of csruids.
   */
  public abstract getPiiData(
    csruids: string[]
  ): Promise<SurveyAttributes<PIIInfo>[]>;

  /**
   * Tracks a proposed set of items as a new batch.
   *
   * Performs the underlying operations in a strict transaction to ensure that
   * id sequences can not have any gaps. It is anticpated that only one active
   * request will occur at a time as part of a batch workflow.
   */
  public async trackBatch(items: T[]): Promise<Batch<T> | null> {
    if (items == null || items.length === 0) {
      return null;
    }

    return this.sql.nonPii.transaction(
      { isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE },
      async t => {
        // Increment and retrieve a new batch id.
        const batchId = await this.createNewBatchId(t);

        // Increment and assign ids from the items sequence & associate to
        // the newly created batch.
        const trackedItems = await this.trackBatchItems(t, batchId, items);

        return {
          id: batchId,
          items: trackedItems
        };
      }
    );
  }

  private async createNewBatchId(t: Sequelize.Transaction): Promise<number> {
    const batchSeq = await this.gaplessSeq.find({
      where: { name: this.batchSeq },
      transaction: t
    });

    const prevId = batchSeq.index;
    await batchSeq.increment("index", { transaction: t });

    const created = await this.batchModel.create(
      {
        id: prevId + 1,
        uploaded: false
      },
      { transaction: t }
    );

    return created.id;
  }

  private async trackBatchItems(
    t: Sequelize.Transaction,
    batchId: number,
    items: T[]
  ): Promise<T[]> {
    const itemSeq = await this.gaplessSeq.find({
      where: { name: this.itemSeq },
      transaction: t
    });

    const nextVal = itemSeq.index + 1;
    await itemSeq.increment("index", { by: items.length, transaction: t });

    const assigned = [];

    for (let i = 0; i < items.length; i++) {
      const numericId = i + nextVal;
      const item = items[i];
      assigned.push({
        id: numericId,
        batchId: batchId,
        surveyId: item.surveyId,
        uploaded: false
      });
    }

    const tracked = await this.itemModel.bulkCreate(assigned, {
      transaction: t
    });

    // We don't re-query because we are not relying on any columns that should
    // be generated or modified by the database.
    return tracked.map(x => {
      const item = items.find(i => i.surveyId === x.surveyId);
      return {
        ...item,
        workflowId: x.id
      };
    });
  }
}
