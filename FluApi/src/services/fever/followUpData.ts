// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { BatchAttributes, BatchDiscardAttributes, BatchItemAttributes, defineFeverModels, FeverModels } from "../../models/db/fever";
import { SurveyCompleteDataAccess } from "./surveyCompleteData";
import { Model, SplitSql } from "../../util/sql";
import Sequelize from "sequelize";

export const FOLLOWUP_BATCH_NAMESPACE = "FollowUp_Batch";
export const FOLLOWUP_ITEMS_NAMESPACE = "FollowUp_Items";

/**
 * Data access object for retrieving participants that have completed the second
 * half of the app and can be sent a follow up survey for feedback.
 */
export class FollowUpDataAccess extends SurveyCompleteDataAccess {
  protected batchSeq: string = FOLLOWUP_BATCH_NAMESPACE;
  protected itemSeq: string = FOLLOWUP_ITEMS_NAMESPACE;
  protected readonly fever: FeverModels;
  protected readonly batchModel: Model<BatchAttributes>;
  protected readonly itemModel: Model<BatchItemAttributes>;
  protected readonly discardModel: Model<BatchDiscardAttributes>;

  constructor(sql: SplitSql) {
    super(sql);
    this.fever = defineFeverModels(sql);
    this.batchModel = this.fever.followUpBatch;
    this.itemModel = this.fever.followUpItem;
    this.discardModel = this.fever.followUpDiscard;
  }

  protected surveyPredicate() {
    return {
      survey: {
        isDemo: false,
        workflow: {
          surveyCompletedAt: {
            [Sequelize.Op.ne]: null
          }
        }
      }
    };
  }
}
