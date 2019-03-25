// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { PIIInfo } from "audere-lib/feverProtocol";
import { BatchItem, SurveyBatchDataAccess, BatchItemWithCsruid } from "./surveyBatchData";
import { BatchAttributes, BatchDiscardAttributes, BatchItemAttributes, SurveyAttributes, FeverModels, defineFeverModels } from "../../models/db/fever";
import { Model, SplitSql } from "../../util/sql";
import Sequelize from "sequelize";
import logger from "../../util/logger";

export const KIT_BATCH_NAMESPACE = "Kit_Batch";
export const KIT_ITEMS_NAMESPACE = "Kit_Items";

export class KitRecipientsDataAccess extends SurveyBatchDataAccess<BatchItemWithCsruid> {
  private readonly fever: FeverModels;
  protected readonly batchModel: Model<BatchAttributes>;
  protected readonly itemModel: Model<BatchItemAttributes>;
  protected readonly discardModel: Model<BatchDiscardAttributes>;

  protected batchSeq: string = KIT_BATCH_NAMESPACE;
  protected itemSeq: string = KIT_ITEMS_NAMESPACE;

  constructor(sql: SplitSql) {
    super(sql);
    this.fever = defineFeverModels(sql);
    this.batchModel = this.fever.kitBatch;
    this.itemModel = this.fever.kitItem;
    this.discardModel = this.fever.kitDiscard;

    this.fever.surveyNonPii.hasOne(this.itemModel, {
      foreignKey: "surveyId",
      as: "items",
      onDelete: "CASCADE"
    });
  }

  private surveyPredicate() {
    return {
      survey: {
        isDemo: false,
        workflow: {
          screeningCompletedAt: {
            [Sequelize.Op.ne]: null
          }
        }
      }
    };
  }

  /**
   * Retrieves kit orders based on an input set of previously assigned items.
   */
  public async getExistingItems(
    items: BatchItem[]
  ): Promise<BatchItemWithCsruid[] | null> {
    return this.getItems(items);
  }

  /**
   * Retrieves kit orders that have not been processed yet.
   */
  public async getNewItems(): Promise<BatchItemWithCsruid[] | null> {
    return this.getItems();
  }

  /**
   * Queries for valid records to form a batch.  May be seeded with a
   * constrained list of surveys to include.  
   * @param items 
   */
  private async getItems(
    items?: BatchItem[]
  ): Promise<BatchItemWithCsruid[] | null> {
    let filter = this.surveyPredicate();

    if (items != null) {
      filter = {
        ...filter,
        ...{ id: items.map(x => x.surveyId) }
      }
    } else {
      filter = {
        ...filter,
        ...{ "$items.surveyId$": null }
      }
    }

    const surveys = await this.fever.surveyNonPii.findAll({
      where: {
        ...filter
      },
      include: [
        {
          model: this.itemModel,
          as: "items",
          required: false
        }
      ],
      order: [["id", "ASC"]]
    });

    if (surveys != null && surveys.length > 0) {
      const result: BatchItemWithCsruid[] = surveys.map(s => {
        const item: BatchItemWithCsruid = {
          surveyId: +s.id,
          csruid: s.csruid
        };

        if (items != null) {
          const i = items.find(x => x.surveyId === item.surveyId);
          item.workflowId = i.workflowId;
        }

        return item;
      });

      return result;
    } else {
      logger.debug("No new kit recipients to process.");
    }

    return null;
  }

  public async getPiiData(
    csruids: string[]
  ): Promise<SurveyAttributes<PIIInfo>[]> {
    const filter = this.surveyPredicate();

    return await this.fever.surveyPii.findAll({
      where: {
        ...filter,
        csruid: csruids
      }
    });
  }
}