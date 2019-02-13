// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import request from "supertest";
import { DocumentType, SurveyDocument, SurveyInfo } from "audere-lib/feverProtocol";
import { createPublicApp } from "../../src/app";
import {
  PATIENT_INFO,
  PII,
  SURVEY_INFO,
  SURVEY_NONPII,
  surveyPost,
  surveyNonPIIInDb,
  makeCSRUID
} from "./feverSampleData";
import { createSplitSql } from "../../src/util/sql";
import { defineFeverModels } from "../../src/services/feverApi/models";

describe("putFeverDocument", () => {
  let sql;
  let publicApp;
  let models;
  let accessKey;

  beforeAll(async done => {
    sql = createSplitSql();
    publicApp = createPublicApp(sql);
    models = defineFeverModels(sql);
    accessKey = await models.accessKey.create({
      key: "accesskey1",
      valid: true
    });
    done();
  });

  afterAll(async done => {
    await accessKey.destroy();
    await sql.close();
    done();
  });

  it("rejects malformed json", async () => {
    const csruid = makeCSRUID("rejects malformed json");
    await request(publicApp)
      .put(`/api/fever/documents/${accessKey.key}/${csruid}`)
      .send("{ bad json")
      .set("Content-Type", "application/json")
      .expect(400);
  });

  it("converts invalid UTF8 to replacement characters", async () => {
    const csruid = makeCSRUID(
      "converts invalid UTF8 to replacement characters"
    );
    const contents = {
      device: { info: "☢" },
      documentType: DocumentType.Survey,
      csruid,
      survey: SURVEY_INFO,
    };
    const contentsBuffer = Buffer.from(JSON.stringify(contents));

    // Manually edit the buffer to replace the ☢ symbol with an invalid byte seqence
    contentsBuffer[19] = 0xed;
    contentsBuffer[20] = 0xa0;
    contentsBuffer[21] = 0x80;

    const req = request(publicApp)
      .put(`/api/fever/documents/${accessKey.key}/${csruid}`)
      .set("Content-Type", "application/json");
    req.write(contentsBuffer);
    await req.expect(200);

    const dbNonPII = await models.surveyNonPII.findOne({ where: { csruid } });
    expect(dbNonPII.device).not.toEqual(contents.device);
    expect(dbNonPII.device).toEqual({ info: "���" });
    await dbNonPII.destroy();

    await models.surveyPII.destroy({ where: { csruid } });
  });

  it("adds the document to the survey table in each db", async () => {
    const csruid = makeCSRUID(
      "adds the document to the survey table in each db"
    );
    const contentsPost = surveyPost(csruid);

    await request(publicApp)
      .put(`/api/fever/documents/${accessKey.key}/${csruid}`)
      .send(contentsPost)
      .expect(200);

    const dbNonPII = await models.surveyNonPII.findOne({
      where: { csruid }
    });
    expect(dbNonPII.csruid).toEqual(csruid);
    expect(dbNonPII.device).toEqual(contentsPost.device);
    expect(dbNonPII.survey).toEqual(SURVEY_NONPII);
    await dbNonPII.destroy();

    const dbPII = await models.surveyPII.findOne({ where: { csruid } });
    expect(dbPII.csruid).toEqual(csruid);
    expect(dbPII.survey).toEqual(PII);
    await dbPII.destroy();
  });

  it("updates existing documents in survey table in PII db", async () => {
    const csruid = makeCSRUID(
      "updates existing documents in survey table in PII db"
    );
    const where = { where: { csruid }};
    const contentsPost = surveyPost(csruid);

    await request(publicApp)
      .put(`/api/fever/documents/${accessKey.key}/${csruid}`)
      .send(contentsPost)
      .expect(200);
    const originalScreen = (await models.surveyPII.findOne(where)).survey as SurveyInfo;
    expect(originalScreen.patient.name).toEqual(PATIENT_INFO.name);
    expect(originalScreen).toEqual(PII);

    const newPatient = { ...PATIENT_INFO, name: "New Fake Name" };
    const newProtocolContents: SurveyDocument = {
      ...contentsPost,
      survey: {
        ...SURVEY_INFO,
        patient: newPatient
      }
    };
    await request(publicApp)
      .put(`/api/fever/documents/${accessKey.key}/${csruid}`)
      .send(newProtocolContents)
      .expect(200);

    const dbPII = await models.surveyPII.findOne(where);
    const newDoc = dbPII.survey as SurveyInfo;
    expect(newDoc.patient.name).toEqual("New Fake Name");
    expect(newDoc).toEqual({ ...PII, patient: newPatient });
    await dbPII.destroy();

    const dbNonPII = await models.surveyNonPII.findOne(where);
    expect(dbNonPII.survey).toEqual(surveyNonPIIInDb(csruid).survey);
    await dbNonPII.destroy();
  });
});

describe("putDocumentWithKey", () => {
  let sql;
  let publicApp;
  let models;

  beforeAll(async done => {
    sql = createSplitSql();
    publicApp = createPublicApp(sql);
    models = defineFeverModels(sql);
    done();
  });

  afterAll(async done => {
    await sql.close();
    done();
  });

  it("accepts a docuent with a valid key", async () => {
    const csruid = makeCSRUID("accepts a docuent with a valid key");
    const where = { where: { csruid }};
    const accessKey = await models.accessKey.create({
      key: "accesskey1",
      valid: true
    });

    await request(publicApp)
      .put(`/api/fever/documents/${accessKey.key}/${csruid}`)
      .send(surveyPost(csruid))
      .expect(200);

    const surveyNonPII = await models.surveyNonPII.findOne(where);
    const surveyPII = await models.surveyPII.findOne(where);

    expect(surveyNonPII).not.toBeNull();
    expect(surveyPII).not.toBeNull();

    await destroy(surveyNonPII, surveyPII, surveyNonPII, surveyPII, accessKey);
  });

  it("rejects a docuent with a bogus key", async () => {
    const csruid = makeCSRUID("rejects a docuent with a bogus key");
    const where = { where: { csruid }};

    await request(publicApp)
      .put(`/api/fever/documents/notaccesskey2/${csruid}`)
      .send(surveyPost(csruid))
      .expect(404);

    expect(await models.surveyNonPII.findOne(where)).toBeNull();
    expect(await models.surveyPII.findOne(where)).toBeNull();
  });

  it("rejects a docuent with key that's no longer valid", async () => {
    const csruid = makeCSRUID(
      "rejects a docuent with key that's no longer valid"
    );
    const where = { where: { csruid }};
    const accessKey = await models.accessKey.create({
      key: "accesskey3",
      valid: false
    });

    await request(publicApp)
      .put(`/api/fever/documents/${accessKey.key}/${csruid}`)
      .send(surveyPost(csruid))
      .expect(404);

    expect(await models.surveyNonPII.findOne(where)).toBeNull();
    expect(await models.surveyPII.findOne(where)).toBeNull();

    await accessKey.destroy();
  });
});

async function destroy(...items: any[]): Promise<void> {
  await Promise.all(items.map(x => x.destroy()));
}
