// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { AddressInfoUse, PIIInfo, TelecomInfoSystem } from "audere-lib/feverProtocol";
import { BatchItem, SurveyBatchDataAccess } from "./surveyBatchData";
import { UWParticipantReport, Participant } from "./uwParticipantReport";
import { UWUploader } from "./uwUploader";
import { defineIncentiveItem, defineIncentiveBatch, SurveyAttributes, defineIncentiveDiscard } from "../../models/fever";
import { GeocodingService } from "../geocodingService";
import { SplitSql } from "../../util/sql";
import Sequelize from "sequelize";

export class Incentives extends UWParticipantReport {
  protected readonly geocoder;
  private readonly uploader;

  constructor(
    dao: IncentiveRecipientsDataAccess,
    geocoder: GeocodingService,
    uploader: UWUploader
  ) {
    super(dao);
    this.geocoder = geocoder;
    this.uploader = uploader;
  }

  public transformSurveyData(
    item: BatchItem,
    pii: SurveyAttributes<PIIInfo>
  ): Participant {
    const email = pii.survey.patient.telecom
      .find(t => t.system === TelecomInfoSystem.Email);

    const homeAddress = pii.survey.patient.address
      .find(a => a.use === AddressInfoUse.Home);

    if (email == null || homeAddress == null) {
      throw new Error("A survey without an email address or home address " +
        "can not be converted into an incentive. csruid " + item.csruid +
        " may be malformed.");
    }

    const recipient: Participant = {
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

  public async writeReport(batchId: number, report: string): Promise<void> {
    await this.uploader.sendIncentives(batchId, report);
  }
}

export const INCENTIVE_BATCH_NAMESPACE = "Incentives_Batch";
export const INCENTIVE_ITEMS_NAMESPACE = "Incentives_Items";

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
      INCENTIVE_BATCH_NAMESPACE,
      INCENTIVE_ITEMS_NAMESPACE
    );
  }

  public surveyPredicate() {
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
