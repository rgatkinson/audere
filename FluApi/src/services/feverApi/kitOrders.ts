// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { AddressInfoUse, PIIInfo, TelecomInfoSystem } from "audere-lib/feverProtocol";
import { BatchItem, SurveyBatchDataAccess } from "./surveyBatchData";
import { UWParticipantReport, Participant } from "./uwParticipantReport";
import { UWUploader } from "./uwUploader";
import { defineKitItem, defineKitBatch, SurveyAttributes, defineKitDiscard } from "../../models/fever";
import { GeocodingService } from "../geocodingService";
import { SplitSql } from "../../util/sql";
import Sequelize from "sequelize";

export class KitOrders extends UWParticipantReport {
  protected readonly geocoder;
  private readonly uploader;

  constructor(
    dao: KitRecipientsDataAccess,
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

    if (homeAddress == null) {
      throw new Error("A survey without a home address can not be converted " +
        "into an kit order. csruid " + item.csruid + " may be malformed.");
    }

    const recipient: Participant = {
      workflowId: item.workflowId,
      surveyId: item.surveyId,
      firstName: pii.survey.patient.firstName.trim(),
      lastName: pii.survey.patient.lastName.trim(),
      homeAddress: homeAddress,
      // This email address is used by the UW for the fulfillment house and
      // for answering questions about the mailing process.
      email: email == null ? "kittrack@uw.edu" : email.value,
      timestamp: pii.survey.workflow.surveyCompletedAt
    }

    return recipient;
  }

  public async writeReport(batchId: number, report: string): Promise<void> {
    await this.uploader.sendKits(batchId, report);
  }
}

export const KIT_BATCH_NAMESPACE = "Kit_Batch";
export const KIT_ITEMS_NAMESPACE = "Kit_Items";

export class KitRecipientsDataAccess extends SurveyBatchDataAccess {
  constructor(sql: SplitSql) {
    const kitBatch = defineKitBatch(sql.nonPii);
    const kitItems = defineKitItem(sql.nonPii);
    const kitDiscard = defineKitDiscard(sql.nonPii);

    super(
      sql,
      kitBatch,
      kitItems,
      kitDiscard,
      KIT_BATCH_NAMESPACE,
      KIT_ITEMS_NAMESPACE
    );
  }

  public surveyPredicate() {
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
}
