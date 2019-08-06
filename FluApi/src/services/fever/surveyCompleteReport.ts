// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  AddressInfo,
  AddressInfoUse,
  PIIInfo,
  TelecomInfoSystem,
} from "audere-lib/feverProtocol";
import { Batch } from "./surveyBatchData";
import { SurveyAttributes } from "../../models/db/fever";
import { PIIReport, RenderResult } from "./piiReport";
import { SurveyCompleteItem } from "./surveyCompleteData";
import { parse } from "json2csv";

export interface SurveyCompleteParticipant {
  workflowId?: number;
  surveyId: number;
  firstName: string;
  lastName: string;
  homeAddress: AddressInfo;
  email: string;
  timestamp: string;
  dateReceived: string;
  boxBarcode: string;
  incentiveAmount: string;
}

/**
 * Generates a common report for data from the end of the survey lifecycle. The
 * logic to retrieve rows may be customized but the output format is shared.
 */
export abstract class SurveyCompletedReport extends PIIReport<
  SurveyCompleteItem,
  SurveyCompleteParticipant
> {
  protected abstract report: string;

  /**
   * Converts a batch into a CSV output string.
   */
  public async buildReport(
    batch: Batch<SurveyCompleteParticipant>
  ): Promise<RenderResult> {
    const rows = [];
    const discarded = [];

    batch.items.forEach(i => {
      const row = {
        "First Name": i.firstName,
        "Last Name": i.lastName,
        "Address 1": i.homeAddress.line[0],
        "Address 2": i.homeAddress.line[1],
        City: i.homeAddress.city,
        State: i.homeAddress.state,
        Zip: i.homeAddress.postalCode,
        Email: i.email,
        Timestamp: i.timestamp,
        "Date Kit Received": i.dateReceived,
        "Box Barcode": i.boxBarcode,
        "Workflow ID": i.workflowId.toFixed(),
        "Audere System ID": i.surveyId.toFixed(),
        "Incentive Amount": i.incentiveAmount,
      };

      rows.push(row);
    });

    const csv = rows.length > 0 ? parse(rows, { header: true }) : undefined;
    return { report: csv, discarded: discarded };
  }

  /**
   * Converts a non-PII survey item and a PII survey item into the necessary
   * information for generating a row of the report.
   */
  public transformSurveyData(
    item: SurveyCompleteItem,
    pii: SurveyAttributes<PIIInfo>
  ): SurveyCompleteParticipant {
    const email = pii.survey.patient.telecom.find(
      t => t.system === TelecomInfoSystem.Email
    );

    const homeAddress = pii.survey.patient.address.find(
      a => a.use === AddressInfoUse.Home
    );

    if (email == null) {
      throw Error(`${item.surveyId} has no email and may be malformed`);
    }

    const appBuilds = pii.survey.consents
      .map(c => +c.appBuild)
      .filter(build => build != null);
    const build = Math.min(...appBuilds);

    let incentiveAmount;
    if (Number.isNaN(build) || !Number.isFinite(build) || build <= 48) {
      incentiveAmount = "50.00";
    } else {
      incentiveAmount = "25.00";
    }

    const recipient: SurveyCompleteParticipant = {
      workflowId: item.workflowId,
      surveyId: item.surveyId,
      firstName: (pii.survey.patient.firstName || "").trim(),
      lastName: (pii.survey.patient.lastName || "").trim(),
      homeAddress: homeAddress,
      email: email.value,
      timestamp: pii.survey.workflow.surveyCompletedAt,
      dateReceived: item.dateReceived,
      boxBarcode: item.boxBarcode,
      incentiveAmount: incentiveAmount,
    };

    return recipient;
  }
}
