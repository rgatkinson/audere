// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import request from "supertest";
import {
  DocumentType,
  VisitDocument,
  VisitInfo,
} from "audere-lib/snifflesProtocol";
import { publicApp } from "../../src/app";
import { VisitNonPII, VisitPII } from "../../src/models/visit";
import { AccessKey } from "../../src/models/accessKey";
import {
  PATIENT_INFO,
  VISIT_INFO,
  VISIT_NONPII,
  VISIT_PII,
  documentContentsPost,
  documentContentsNonPII,
  documentContentsPII,
  makeCSRUID
} from "../util/sample_data";

describe("putDocument", () => {
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
    await request(publicApp)
      .put(`/api/documents/${accessKey.key}/${csruid}`)
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
      documentType: DocumentType.Visit,
      csruid,
      visit: { data: "fakeVisitData" }
    };
    const contentsBuffer = Buffer.from(JSON.stringify(contents));

    // Manually edit the buffer to replace the ☢ symbol with an invalid byte seqence
    contentsBuffer[19] = 0xed;
    contentsBuffer[20] = 0xa0;
    contentsBuffer[21] = 0x80;

    const req = request(publicApp)
      .put(`/api/documents/${accessKey.key}/${csruid}`)
      .set("Content-Type", "application/json");
    req.write(contentsBuffer);
    await req.expect(200);

    const visit = await VisitNonPII.findOne({ where: { csruid } });
    expect(visit.device).not.toEqual(contents.device);
    expect(visit.device).toEqual({ info: "���" });
    await visit.destroy();

    await VisitPII.destroy({ where: { csruid } });
  });

  it("adds the document to the visits table in each db", async () => {
    const csruid = makeCSRUID(
      "adds the document to the visits table in each db"
    );
    const contentsPost = documentContentsPost(csruid);

    await request(publicApp)
      .put(`/api/documents/${accessKey.key}/${csruid}`)
      .send(contentsPost)
      .expect(200);

    const visitNonPII = await VisitNonPII.findOne({
      where: { csruid }
    });
    expect(visitNonPII.csruid).toEqual(csruid);
    expect(visitNonPII.device).toEqual(contentsPost.device);
    expect(visitNonPII.visit).toEqual(VISIT_NONPII);
    await visitNonPII.destroy();

    const visitPII = await VisitPII.findOne({ where: { csruid } });
    expect(visitPII.csruid).toEqual(csruid);
    expect(visitPII.visit).toEqual(VISIT_PII);
    await visitPII.destroy();
  });

  it("updates existing documents in visits table in PII db", async () => {
    const csruid = makeCSRUID(
      "updates existing documents in visits table in PII db"
    );
    const contentsPost = documentContentsPost(csruid);
    const contentsNonPII = documentContentsNonPII(csruid);
    const contentsPII = documentContentsPII(csruid);

    await VisitNonPII.upsert(contentsNonPII);
    await VisitPII.upsert(contentsPII);

    const newPatient = { ...PATIENT_INFO, name: "New Fake Name" };
    const newProtocolContents: VisitDocument = {
      ...contentsPost,
      visit: {
        ...VISIT_INFO,
        patient: newPatient
      }
    };

    await request(publicApp)
      .put(`/api/documents/${accessKey.key}/${csruid}`)
      .send(newProtocolContents)
      .expect(200);

    const newPIIVisit = await VisitPII.findOne({
      where: { csruid }
    });
    const newVisitDoc = newPIIVisit.visit as VisitInfo;
    expect(newVisitDoc.patient.name).toEqual("New Fake Name");
    expect(newVisitDoc).toEqual({ ...VISIT_PII, patient: newPatient });
    await newPIIVisit.destroy();

    const newNonPIIVisit = await VisitNonPII.findOne({
      where: { csruid }
    });
    expect(newNonPIIVisit.visit).toEqual(contentsNonPII.visit);
    await newNonPIIVisit.destroy();
  });
});

describe("putDocumentWithKey", () => {
  it("accepts a docuent with a valid key", async () => {
    const csruid = makeCSRUID("accepts a docuent with a valid key");
    const contentsPost = documentContentsPost(csruid);

    const accessKey = await AccessKey.create({
      key: "accesskey1",
      valid: true
    });

    await request(publicApp)
      .put(`/api/documents/${accessKey.key}/${csruid}`)
      .send(contentsPost)
      .expect(200);

    const newVisitNonPII = await VisitNonPII.findOne({
      where: { csruid }
    });
    expect(newVisitNonPII).not.toBeNull();

    const newVisitPII = await VisitPII.findOne({
      where: { csruid }
    });
    expect(newVisitPII).not.toBeNull();

    await newVisitNonPII.destroy();
    await newVisitPII.destroy();
    await accessKey.destroy();
  });

  it("rejects a docuent with a bogus key", async () => {
    const csruid = makeCSRUID("rejects a docuent with a bogus key");
    const contentsPost = documentContentsPost(csruid);

    const accessKey = await AccessKey.create({
      key: "accesskey2",
      valid: true
    });

    await request(publicApp)
      .put(`/api/documents/notaccesskey2/${csruid}`)
      .send(contentsPost)
      .expect(404);

    const newVisitNonPII = await VisitNonPII.findOne({
      where: { csruid }
    });
    expect(newVisitNonPII).toBeNull();

    const newVisitPII = await VisitPII.findOne({
      where: { csruid }
    });
    expect(newVisitPII).toBeNull();

    await accessKey.destroy();
  });

  it("rejects a docuent with key that's no longer valid", async () => {
    const csruid = makeCSRUID(
      "rejects a docuent with key that's no longer valid"
    );
    const contentsPost = documentContentsPost(csruid);

    const accessKey = await AccessKey.create({
      key: "accesskey3",
      valid: false
    });

    await request(publicApp)
      .put(`/api/documents/${accessKey.key}/${csruid}`)
      .send(contentsPost)
      .expect(404);

    const newVisitNonPII = await VisitNonPII.findOne({
      where: { csruid }
    });
    expect(newVisitNonPII).toBeNull();

    const newVisitPII = await VisitPII.findOne({
      where: { csruid }
    });
    expect(newVisitPII).toBeNull();

    await accessKey.destroy();
  });
});
