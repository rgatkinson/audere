// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SurveyCompleteDataAccess } from "./surveyCompleteData";
import { BatchAttributes, BatchDiscardAttributes, BatchItemAttributes } from "../../models/db/fever";
import { GaplessSeqAttributes } from "../../models/db/gaplessSeq";
import { Model, SplitSql } from "../../util/sql";

export const INCENTIVE_BATCH_NAMESPACE = "Incentives_Batch";
export const INCENTIVE_ITEMS_NAMESPACE = "Incentives_Items";

/**
 * Data access object for retrieving participants that have completed the second
 * half of the app and have had their specimen kit processed.
 */
export class IncentiveRecipientsDataAccess extends SurveyCompleteDataAccess {
  protected batchSeq: string = INCENTIVE_BATCH_NAMESPACE;
  protected itemSeq: string = INCENTIVE_ITEMS_NAMESPACE;

  constructor(
    sql: SplitSql,
    gaplessSeq: Model<GaplessSeqAttributes>,
    batchModel: Model<BatchAttributes>,
    itemModel: Model<BatchItemAttributes>,
    discardModel: Model<BatchDiscardAttributes>
  ) {
    super(sql, gaplessSeq, batchModel, itemModel, discardModel);
  }

  protected requireReceivedKit: boolean = true;
}
