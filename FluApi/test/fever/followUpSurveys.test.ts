// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  instance,
  mock,
  when,
  anyString,
  capture,
  deepEqual,
  verify,
} from "ts-mockito";
import { FollowUpDataAccess } from "../../src/services/fever/followUpData";
import { FollowUpSurveys } from "../../src/services/fever/followUpSurveys";
import { SurveyCompleteParticipant } from "../../src/services/fever/surveyCompleteReport";
import { Batch } from "../../src/services/fever/surveyBatchData";
import { S3Uploader } from "../../src/external/s3Uploader";
import { makeRandomIncentiveRecipient } from "./reportTestUtil";
import parse from "csv-parse/lib/sync";
import { REDCapClient } from "../../src/external/redCapClient";

export class TestFollowUps extends FollowUpSurveys {
  private readonly batch: Batch<SurveyCompleteParticipant>;

  constructor(
    batch: Batch<SurveyCompleteParticipant>,
    dao: FollowUpDataAccess,
    uploader: S3Uploader
  ) {
    super(dao, uploader, undefined);
    this.batch = batch;
  }

  public async getBatch(): Promise<Batch<SurveyCompleteParticipant> | null> {
    return Promise.resolve(this.batch);
  }
}

describe("sending follow up surveys", () => {
  it("should convert output to CSV format", async () => {
    const items = [
      makeRandomIncentiveRecipient(2),
      makeRandomIncentiveRecipient(3),
      makeRandomIncentiveRecipient(4),
      makeRandomIncentiveRecipient(5),
    ];
    const batch = { id: 8, items: items };

    const dao = mock(FollowUpDataAccess);
    when(dao.commitUploadedBatch(batch.id, [])).thenResolve();

    const uploader = mock(S3Uploader);
    when(uploader.sendFollowUps(batch.id, anyString())).thenResolve();

    const i = new TestFollowUps(batch, instance(dao), instance(uploader));
    await i.generateReport();

    const contents = capture(uploader.sendFollowUps).first()[1];
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
          row[12] === item.surveyId.toFixed()
        );
      });

      expect(contains).toBe(true);
    });
  });
});

describe("importing survey results", () => {
  it("imports surveys received from REDCap", async () => {
    const surveys = [
      {
        record_id: 1,
        email: "test@test.com",
        daily_activity: 1,
        medications: 1,
        care___1: 1,
        care___2: 1,
        care___3: 1,
        care___4: 1,
        care___5: 1,
        care___6: 1,
        care___7: 1,
        care___8: 1,
        care_other: "",
        found_study: 1,
      },
    ];

    const client = mock(REDCapClient);
    when(client.getFollowUpSurveys()).thenResolve(surveys);

    const dao = mock(FollowUpDataAccess);
    when(dao.importFollowUpSurveys(deepEqual(surveys))).thenResolve();

    const service = new FollowUpSurveys(
      instance(dao),
      undefined,
      instance(client)
    );

    await service.importFollowUpResults();

    verify(dao.importFollowUpSurveys(deepEqual(surveys))).once();
  });
});
