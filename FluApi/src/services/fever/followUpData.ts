// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SurveyCompleteDataAccess } from "./surveyCompleteData";
import { BatchAttributes, BatchDiscardAttributes, BatchItemAttributes } from "../../models/db/fever";
import { GaplessSeqAttributes } from "../../models/db/gaplessSeq";
import { Model, SplitSql } from "../../util/sql";

export const FOLLOWUP_BATCH_NAMESPACE = "FollowUp_Batch";
export const FOLLOWUP_ITEMS_NAMESPACE = "FollowUp_Items";

/**
 * Data access object for retrieving participants that have completed the second
 * half of the app and can be sent a follow up survey for feedback.
 */
export class FollowUpDataAccess extends SurveyCompleteDataAccess {
  protected batchSeq: string = FOLLOWUP_BATCH_NAMESPACE;
  protected itemSeq: string = FOLLOWUP_ITEMS_NAMESPACE;

  constructor(
    sql: SplitSql,
    gaplessSeq: Model<GaplessSeqAttributes>,
    batchModel: Model<BatchAttributes>,
    itemModel: Model<BatchItemAttributes>,
    discardModel: Model<BatchDiscardAttributes>
  ) {
    super(sql, gaplessSeq, batchModel, itemModel, discardModel);
  }

  protected requireReceivedKit: boolean = false;
  protected requireSurveyComplete: boolean = true;
}
