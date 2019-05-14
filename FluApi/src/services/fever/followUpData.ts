// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SurveyCompleteDataAccess } from "./surveyCompleteData";
import {
  BatchAttributes,
  BatchDiscardAttributes,
  BatchItemAttributes
} from "../../models/db/fever";
import { GaplessSeqAttributes } from "../../models/db/gaplessSeq";
import { Model, SplitSql } from "../../util/sql";
import { FollowUpSurveyData } from "../../external/redCapClient";
import {
  HutchUploadModel,
  defineHutchUpload
} from "../../models/db/hutchUpload";
import sequelize = require("sequelize");
import logger from "../../util/logger";

export const FOLLOWUP_BATCH_NAMESPACE = "FollowUp_Batch";
export const FOLLOWUP_ITEMS_NAMESPACE = "FollowUp_Items";

/**
 * Data access object for retrieving participants that have completed the second
 * half of the app and can be sent a follow up survey for feedback.
 */
export class FollowUpDataAccess extends SurveyCompleteDataAccess {
  protected batchSeq: string = FOLLOWUP_BATCH_NAMESPACE;
  protected itemSeq: string = FOLLOWUP_ITEMS_NAMESPACE;

  private readonly hutchUpload: HutchUploadModel;

  constructor(
    sql: SplitSql,
    gaplessSeq: Model<GaplessSeqAttributes>,
    batchModel: Model<BatchAttributes>,
    itemModel: Model<BatchItemAttributes>,
    discardModel: Model<BatchDiscardAttributes>
  ) {
    super(sql, gaplessSeq, batchModel, itemModel, discardModel);
    this.hutchUpload = defineHutchUpload(sql);
  }

  protected requireReceivedKit: boolean = false;
  protected requireSurveyComplete: boolean = true;

  public async importFollowUpSurveys(
    surveys: FollowUpSurveyData[]
  ): Promise<void> {
    const existing = await this.fever.followUpSurveys.findAll({
      where: {
        email: surveys.map(s => s.email)
      }
    });

    const added = surveys.filter(s => !existing.some(e => e.email === s.email));

    if (added.length > 0) {
      const pii = await this.sql.pii.query(
        `select
          s.csruid
        from
          fever_current_surveys s,
          json_array_elements(s.survey->'patient'->'telecom') st
        where
          st->>'value' in ('${added.map(a => a.email).join(",")}')`,
        {
          type: sequelize.QueryTypes.SELECT
        }
      );

      if (pii.length > 0) {
        const nonPii = await this.fever.surveyNonPii.findAll({
          where: {
            csruid: pii.map(s => s.csruid)
          }
        });

        await this.hutchUpload.destroy({
          where: {
            survey_id: nonPii.map(s => s.id)
          }
        });
      }

      const rows = added.map(s => ({
        email: s.email,
        survey: s
      }));
      await this.fever.followUpSurveys.bulkCreate(rows);
    }
  }
}
