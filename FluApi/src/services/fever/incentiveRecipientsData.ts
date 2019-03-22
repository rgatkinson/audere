// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { BatchAttributes, BatchDiscardAttributes, BatchItemAttributes, defineFeverModels, FeverModels } from "../../models/db/fever";
import { SurveyCompleteDataAccess } from "./surveyCompleteData";
import { Model, SplitSql } from "../../util/sql";
import Sequelize from "sequelize";

export const INCENTIVE_BATCH_NAMESPACE = "Incentives_Batch";
export const INCENTIVE_ITEMS_NAMESPACE = "Incentives_Items";

/**
 * Data access object for retrieving participants that have completed the second
 * half of the app and have had their specimen kit processed.
 */
export class IncentiveRecipientsDataAccess extends SurveyCompleteDataAccess {
  protected batchSeq: string = INCENTIVE_BATCH_NAMESPACE;
  protected itemSeq: string = INCENTIVE_ITEMS_NAMESPACE;
  protected readonly fever: FeverModels;
  protected readonly batchModel: Model<BatchAttributes>;
  protected readonly itemModel: Model<BatchItemAttributes>;
  protected readonly discardModel: Model<BatchDiscardAttributes>;

  constructor(sql: SplitSql) {
    super(sql);
    this.fever = defineFeverModels(sql);
    this.batchModel = this.fever.incentiveBatch;
    this.itemModel = this.fever.incentiveItem;
    this.discardModel = this.fever.incentiveDiscard;
  }

  protected requireReceivedKit: boolean = true;
}
