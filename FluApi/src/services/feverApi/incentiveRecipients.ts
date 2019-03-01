// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SplitSql } from "../../util/sql";
import { defineIncentiveItem, defineIncentiveBatch, SurveyAttributes, defineIncentiveDiscard } from "../../models/fever";
import { TelecomInfoSystem, AddressInfoUse, AddressInfo, PIIInfo } from "audere-lib/feverProtocol";
import { BatchItem, SurveyBatchDataAccess } from "./surveyBatchData";
import { SurveyBatch } from "./surveyBatch";
import Sequelize from "sequelize";

/**
 * Model for survey incentive.  Includes the required fields to generate a
 * report.
 */
export interface IncentiveRecipient {
  workflowId?: number;
  surveyId: number;
  firstName: string;
  lastName: string;
  homeAddress: AddressInfo;
  email: string;
  timestamp: string;
}

/**
 * Extracts surveys from the database for processing and converts them into
 * an `IncentiveRecipient` that can be published.
 */
export class IncentiveRecipients extends SurveyBatch<IncentiveRecipient> {
  constructor(dao: SurveyBatchDataAccess) {
    super(dao);
  }

  public mapItem(
    item: BatchItem,
    pii: SurveyAttributes<PIIInfo>
  ): IncentiveRecipient {
    const email = pii.survey.patient.telecom
      .find(t => t.system === TelecomInfoSystem.Email);

    const homeAddress = pii.survey.patient.address
      .find(a => a.use === AddressInfoUse.Home);

    if (email == null || homeAddress == null) {
      throw new Error("A survey without an email address or home address " +
        "can not be converted into an incentive. csruid " + item.csruid +
        "may be malformed.");
    }

    const recipient: IncentiveRecipient = {
      workflowId: item.workflowId,
      surveyId: item.surveyId,
      firstName: pii.survey.patient.firstName.trim(),
      lastName: pii.survey.patient.lastName.trim(),
      homeAddress: homeAddress,
      email: email.value,
      timestamp: pii.survey.workflow.surveyCompletedAt
    }

    return recipient;
  }
}

export const INCENTIVES_BATCH_NAMESPACE = "Incentives_Batch";
export const INCENTIVES_ITEMS_NAMESPACE = "Incentives_Items";

export class IncentiveRecipientsDataAccess extends SurveyBatchDataAccess {
  constructor(sql: SplitSql) {
    const incentiveBatch = defineIncentiveBatch(sql.nonPii);
    const incentiveItems = defineIncentiveItem(sql.nonPii);
    const incentiveDiscard = defineIncentiveDiscard(sql.nonPii);

    super(
      sql,
      incentiveBatch,
      incentiveItems,
      incentiveDiscard,
      INCENTIVES_BATCH_NAMESPACE,
      INCENTIVES_ITEMS_NAMESPACE
    );
  }

  public surveyPredicate() {
    return {
      survey: {
        workflow: {
          surveyCompletedAt: {
            [Sequelize.Op.ne]: null
          }
        }
      }
    };
  }
}
