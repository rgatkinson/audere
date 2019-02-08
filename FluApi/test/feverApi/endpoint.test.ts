// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import request from "supertest";
import {
  DocumentType,
  ScreeningDocument,
  ScreeningInfo,
  SurveyDocument,
  SurveyInfo
} from "audere-lib/feverProtocol";
import app from "../../src/app";
import { AccessKey, ScreeningNonPII, ScreeningPII, SurveyNonPII, SurveyPII } from "../../src/services/feverApi/models";
import {
  PATIENT_INFO,
  PII,
  SCREENING_INFO,
  SCREENING_NONPII,
  screeningPost,
  screeningNonPIIInDb,
  screeningPIIInDb,
  SURVEY_INFO,
  SURVEY_NONPII,
  surveyPost,
  surveyNonPIIInDb,
  surveyPIIInDb,
  makeCSRUID
} from "./feverSampleData";

describe("putFeverDocument", () => {
  let accessKey;
  beforeAll(async done => {
    accessKey = await AccessKey.create({
      key: "accesskey1",
      valid: true
    });
    done();
  });

  afterAll(async done => {
    await accessKey.destroy();
    done();
  });

  it("rejects malformed json", async () => {
    const csruid = makeCSRUID("rejects malformed json");
    await request(app)
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
      documentType: DocumentType.Screening,
      csruid,
      screen: { data: "fakeScreeningData" }
    };
    const contentsBuffer = Buffer.from(JSON.stringify(contents));

    // Manually edit the buffer to replace the ☢ symbol with an invalid byte seqence
    contentsBuffer[19] = 0xed;
    contentsBuffer[20] = 0xa0;
    contentsBuffer[21] = 0x80;

    const req = request(app)
      .put(`/api/fever/documents/${accessKey.key}/${csruid}`)
      .set("Content-Type", "application/json");
    req.write(contentsBuffer);
    await req.expect(200);

    const dbNonPII = await ScreeningNonPII.findOne({ where: { csruid } });
    expect(dbNonPII.device).not.toEqual(contents.device);
    expect(dbNonPII.device).toEqual({ info: "���" });
    await dbNonPII.destroy();

    await ScreeningPII.destroy({ where: { csruid } });
  });

  it("adds the document to the screening table in each db", async () => {
    const csruid = makeCSRUID(
      "adds the document to the screening table in each db"
    );
    const contentsPost = screeningPost(csruid);

    await request(app)
      .put(`/api/fever/documents/${accessKey.key}/${csruid}`)
      .send(contentsPost)
      .expect(200);

    const dbNonPII = await ScreeningNonPII.findOne({
      where: { csruid }
    });
    expect(dbNonPII.csruid).toEqual(csruid);
    expect(dbNonPII.device).toEqual(contentsPost.device);
    expect(dbNonPII.screen).toEqual(SCREENING_NONPII);
    await dbNonPII.destroy();

    const dbPII = await ScreeningPII.findOne({ where: { csruid } });
    expect(dbPII.csruid).toEqual(csruid);
    expect(dbPII.screen).toEqual(PII);
    await dbPII.destroy();
  });

  it("updates existing documents in screening table in PII db", async () => {
    const csruid = makeCSRUID(
      "updates existing documents in screening table in PII db"
    );
    const screenNonPII = screeningNonPIIInDb(csruid);
    const contentsPII = screeningPIIInDb(csruid);

    await ScreeningNonPII.upsert(screenNonPII);
    await ScreeningPII.upsert(contentsPII);

    const newPatient = { ...PATIENT_INFO, name: "New Fake Name" };
    const newProtocolContents: ScreeningDocument = {
      ...screeningPost(csruid),
      screen: {
        ...SCREENING_INFO,
        patient: newPatient
      }
    };

    await request(app)
      .put(`/api/fever/documents/${accessKey.key}/${csruid}`)
      .send(newProtocolContents)
      .expect(200);

    const dbPII = await ScreeningPII.findOne({
      where: { csruid }
    });
    const newDoc = dbPII.screen as ScreeningInfo;
    expect(newDoc.patient.name).toEqual("New Fake Name");
    expect(newDoc).toEqual({ ...PII, patient: newPatient });
    await dbPII.destroy();

    const dbNonPII = await ScreeningNonPII.findOne({
      where: { csruid }
    });
    expect(dbNonPII.screen).toEqual(screenNonPII.screen);
    await dbNonPII.destroy();
  });
});

describe("putDocumentWithKey", () => {
  it("accepts a docuent with a valid key", async () => {
    const csruid = makeCSRUID("accepts a docuent with a valid key");
    const where = { where: { csruid }};
    const accessKey = await AccessKey.create({
      key: "accesskey1",
      valid: true
    });

    await request(app)
      .put(`/api/fever/documents/${accessKey.key}/${csruid}`)
      .send(screeningPost(csruid))
      .expect(200);
    await request(app)
      .put(`/api/fever/documents/${accessKey.key}/${csruid}`)
      .send(surveyPost(csruid))
      .expect(200);

    const screenNonPII = await ScreeningNonPII.findOne(where);
    const screenPII = await ScreeningPII.findOne(where);
    const surveyNonPII = await SurveyNonPII.findOne(where);
    const surveyPII = await SurveyPII.findOne(where);

    expect(screenNonPII).not.toBeNull();
    expect(screenPII).not.toBeNull();
    expect(surveyNonPII).not.toBeNull();
    expect(surveyPII).not.toBeNull();

    await destroy(screenNonPII, screenPII, surveyNonPII, surveyPII, accessKey);
  });

  it("rejects a docuent with a bogus key", async () => {
    const csruid = makeCSRUID("rejects a docuent with a bogus key");
    const where = { where: { csruid }};

    await request(app)
      .put(`/api/fever/documents/notaccesskey2/${csruid}`)
      .send(screeningPost(csruid))
      .expect(404);
    await request(app)
      .put(`/api/fever/documents/notaccesskey2/${csruid}`)
      .send(surveyPost(csruid))
      .expect(404);

    expect(await ScreeningNonPII.findOne(where)).toBeNull();
    expect(await ScreeningPII.findOne(where)).toBeNull();
    expect(await SurveyNonPII.findOne(where)).toBeNull();
    expect(await SurveyPII.findOne(where)).toBeNull();
  });

  it("rejects a docuent with key that's no longer valid", async () => {
    const csruid = makeCSRUID(
      "rejects a docuent with key that's no longer valid"
    );
    const where = { where: { csruid }};
    const accessKey = await AccessKey.create({
      key: "accesskey3",
      valid: false
    });

    await request(app)
      .put(`/api/fever/documents/${accessKey.key}/${csruid}`)
      .send(screeningPost(csruid))
      .expect(404);
    await request(app)
      .put(`/api/fever/documents/${accessKey.key}/${csruid}`)
      .send(surveyPost(csruid))
      .expect(404);

    expect(await ScreeningNonPII.findOne(where)).toBeNull();
    expect(await ScreeningPII.findOne(where)).toBeNull();
    expect(await SurveyNonPII.findOne(where)).toBeNull();
    expect(await SurveyPII.findOne(where)).toBeNull();

    await accessKey.destroy();
  });
});

async function destroy(...items: any[]): Promise<void> {
  await Promise.all(items.map(x => x.destroy()));
}