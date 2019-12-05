// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { instance, mock, when } from "ts-mockito";
import { createSplitSql, SplitSql } from "../../../src/util/sql";
import { CoughFollowUpClient } from "../../../src/external/coughFollowUpClient";
import { CoughModels, defineCoughModels } from "../../../src/models/db/cough";
import { QualtricsImport } from "../../../src/services/cough/qualtricsImport";
import { ObjectList } from "aws-sdk/clients/s3";
import AWS from "aws-sdk";
import followUpSurveys from "../../resources/coughFollowUpSurveyExamples.json";

describe("import follow-up surveys", () => {
  let sql: SplitSql;
  let cough: CoughModels;

  const example = followUpSurveys.default.join("\n");

  async function cleanDb() {
    await Promise.all([
      cough.followUpSurvey.destroy({ where: {} }),
      cough.followUpSurveyFile.destroy({ where: {} }),
    ]);
  }

  function getS3Client(list: ObjectList, get: string): AWS.S3 {
    const s3 = new AWS.S3({ region: "us-west-2" });

    const listRequest = mock(AWS.Request);
    when(listRequest.promise()).thenResolve({
      Contents: list,
      $response: null,
    });
    s3.listObjectsV2 = params => {
      return instance(listRequest);
    };

    const getRequest = mock(AWS.Request);

    when(getRequest.promise()).thenResolve({
      Body: get,
      $response: null,
    });
    s3.getObject = params => {
      return instance(getRequest);
    };

    return s3;
  }

  afterAll(async done => {
    await cleanDb();
    done();
  });

  beforeAll(async done => {
    sql = createSplitSql();
    cough = defineCoughModels(sql);
    done();
  });

  beforeEach(async done => {
    await cleanDb();
    done();
  });

  it("should write follow-up survey data on import", async () => {
    const s3Config = {
      fluReportsBucket: "string",
      asprenReportsBucket: "string",
      coughFollowUpBucket: "string",
      fileshareBucket: "string",
      virenaRecordsBucket: "string",
    };
    const list = [
      {
        Key: "abc",
        LastModified: new Date(),
        ETag: "def",
      },
    ];

    const s3 = getS3Client(list, example);
    const followUpClient = new CoughFollowUpClient(s3, s3Config);
    const svc = new QualtricsImport(cough, followUpClient, sql);

    await svc.importFollowUpSurveys();

    const file = await cough.followUpSurveyFile.findOne({
      where: {
        key: list[0].Key,
        hash: list[0].ETag,
      },
    });
    const rows = await cough.followUpSurvey.findAll({});

    expect(file).not.toBeUndefined();
    expect(rows).toHaveLength(followUpSurveys.default.length - 3);
  });

  it("should skip files that have already been processed", async () => {
    const s3Config = {
      fluReportsBucket: "string",
      asprenReportsBucket: "string",
      coughFollowUpBucket: "string",
      fileshareBucket: "string",
      virenaRecordsBucket: "string",
    };
    const list = [
      {
        Key: "abc",
        LastModified: new Date(),
        ETag: "def",
      },
    ];

    const s3 = getS3Client(list, example);
    const followUpClient = new CoughFollowUpClient(s3, s3Config);
    const svc = new QualtricsImport(cough, followUpClient, sql);

    await cough.followUpSurveyFile.create({
      key: list[0].Key,
      hash: list[0].ETag,
    });

    await svc.importFollowUpSurveys();

    const rows = await cough.followUpSurvey.findAll({});
    expect(rows).toHaveLength(0);
  });

  it("should overwrite existing data", async () => {
    const s3Config = {
      fluReportsBucket: "string",
      asprenReportsBucket: "string",
      coughFollowUpBucket: "string",
      fileshareBucket: "string",
      virenaRecordsBucket: "string",
    };
    const list = [
      {
        Key: "abc",
        LastModified: new Date(),
        ETag: "def",
      },
    ];

    const s3 = getS3Client(list, example);
    const followUpClient = new CoughFollowUpClient(s3, s3Config);
    const svc = new QualtricsImport(cough, followUpClient, sql);

    await cough.followUpSurvey.bulkCreate([
      {
        startDate: "7/23/18 12:23",
        endDate: "8/23/19 12:23",
        status: "1",
        progress: "64",
        duration: "240000",
        finished: "1",
        recordedDate: "8/30/19 12:24",
        responseId: "R_1IaSqXtFWDXHBxw",
        externalDataReference: "",
        distributionChannel: "",
        userLanguage: "EN",
        QID12: "",
        QID15: "",
        QID9: "",
        QID17: "",
        QID6: "",
        QID59: "",
        QID16: "",
        QID8: "",
        QID14: "",
        QID23: "",
        QID22: "",
        QID20: "",
        QID21: "",
        QID24: "",
        QID33_1: "",
        QID33_2: "",
        QID33_3: "",
        QID33_7: "",
        QID42: "",
        QID34: "",
        QID43: "",
        QID58: "",
        QID31: "",
        QID46: "",
        QID30: "",
        QID41: "",
        QID44: "",
        QID47_1_1: "",
        QID47_1_2: "",
        QID47_1_3: "",
        QID47_1_4: "",
        QID35: "",
        QID61: "",
        QID45: "",
        QID28: "",
        QID62: "",
        QID63: "",
      },
      {
        startDate: "7/23/18 12:23",
        endDate: "8/23/19 12:23",
        status: "1",
        progress: "64",
        duration: "240000",
        finished: "1",
        recordedDate: "8/30/19 12:24",
        responseId: "extra_record",
        externalDataReference: "",
        distributionChannel: "",
        userLanguage: "EN",
        QID12: "",
        QID15: "",
        QID9: "",
        QID17: "",
        QID6: "",
        QID59: "",
        QID16: "",
        QID8: "",
        QID14: "",
        QID23: "",
        QID22: "",
        QID20: "",
        QID21: "",
        QID24: "",
        QID33_1: "",
        QID33_2: "",
        QID33_3: "",
        QID33_7: "",
        QID42: "",
        QID34: "",
        QID43: "",
        QID58: "",
        QID31: "",
        QID46: "",
        QID30: "",
        QID41: "",
        QID44: "",
        QID47_1_1: "",
        QID47_1_2: "",
        QID47_1_3: "",
        QID47_1_4: "",
        QID35: "",
        QID61: "",
        QID45: "",
        QID28: "",
        QID62: "",
        QID63: "",
      },
    ]);

    await svc.importFollowUpSurveys();

    const rows = await cough.followUpSurvey.findAll({});
    expect(rows).toHaveLength(followUpSurveys.default.length - 3);
    // deleted
    expect(rows.find(r => r.responseId === "extra_record")).toBeUndefined();
    // updated
    expect(rows.find(r => r.responseId === "R_1IaSqXtFWDXHBxw").startDate).toBe(
      "7/23/19 12:23"
    );
  });
});
