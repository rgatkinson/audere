// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import _ from "lodash";
import { instance, mock, when, anyString, capture } from "ts-mockito";
import { surveyPIIInDb } from "../endpoints/feverSampleData";
import { Incentives } from "../../src/services/fever/incentiveRecipients";
import { IncentiveRecipientsDataAccess } from "../../src/services/fever/incentiveRecipientsData";
import { SurveyCompleteParticipant } from "../../src/services/fever/surveyCompleteReport";
import { S3Uploader } from "../../src/external/s3Uploader";
import { Batch } from "../../src/services/fever/surveyBatchData";
import { makeRandomIncentiveRecipient } from "./reportTestUtil";
import parse from "csv-parse/lib/sync";

export class TestIncentives extends Incentives {
  private readonly batch: Batch<SurveyCompleteParticipant>;

  constructor(
    batch: Batch<SurveyCompleteParticipant>,
    dao: IncentiveRecipientsDataAccess,
    uploader: S3Uploader
  ) {
    super(dao, uploader);
    this.batch = batch;
  }

  public async getBatch(): Promise<Batch<SurveyCompleteParticipant> | null> {
    return Promise.resolve(this.batch);
  }
}

describe("sending incentives", () => {
  it("should convert output to CSV format", async () => {
    const items = [
      makeRandomIncentiveRecipient(2),
      makeRandomIncentiveRecipient(3),
      makeRandomIncentiveRecipient(4),
      makeRandomIncentiveRecipient(5)
    ];
    const batch = { id: 8, items: items };

    const dao = mock(IncentiveRecipientsDataAccess);
    when(dao.commitUploadedBatch(batch.id, [])).thenResolve();

    const uploader = mock(S3Uploader);
    when(uploader.sendIncentives(batch.id, anyString())).thenResolve();

    const i = new TestIncentives(batch, instance(dao), instance(uploader));
    await i.generateReport();

    const contents = capture(uploader.sendIncentives).first()[1];
    const rows: string[][] = parse(contents).slice(1);

    items.forEach(item => {
      const contains = rows.some(row => {
        return (
          row[0] === item.firstName &&
          row[1] === item.lastName &&
          row[2] === item.homeAddress.line[0] &&
          row[3] === (item.homeAddress.line[1] || "") &&
          row[4] === item.homeAddress.city &&
          row[5] === item.homeAddress.state &&
          row[6] === item.homeAddress.postalCode &&
          row[7] === item.email &&
          row[8] === item.timestamp &&
          row[9] === item.dateReceived &&
          row[10] === item.boxBarcode &&
          row[11] === item.workflowId.toFixed() &&
          row[12] === item.surveyId.toFixed() &&
          row[13] === "50.00"
        );
      });

      expect(contains).toBe(true);
    });
  });

  it("should set the correct incentive amount", async () => {
    const i = new Incentives(undefined, undefined);
    const item = {
      workflowId: 1,
      surveyId: 1,
      csruid: "1",
      boxBarcode: "11111111",
      dateReceived: "2019-03-22"
    };

    // no app build
    const survey = surveyPIIInDb(item.csruid);
    const one = await i.transformSurveyData(item, survey);
    expect(one.incentiveAmount).toBe("50.00");

    const surveyTwo = _.cloneDeep(survey);
    surveyTwo.survey.consents[0].appBuild = "50";
    const two = await i.transformSurveyData(item, surveyTwo);
    expect(two.incentiveAmount).toBe("25.00");

    const surveyThree = _.cloneDeep(survey);
    surveyThree.survey.consents[0].appBuild = "25";
    const three = await i.transformSurveyData(item, surveyThree);
    expect(three.incentiveAmount).toBe("50.00");
  });
});
