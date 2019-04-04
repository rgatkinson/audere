// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import request from "supertest";
import {
  DocumentType,
  VisitDocument,
  VisitInfo
} from "audere-lib/snifflesProtocol";
import { createPublicApp } from "../../src/app";
import {
  DEVICE,
  PATIENT_INFO,
  VISIT_INFO,
  VISIT_NONPII,
  VISIT_PII,
  documentContentsPost,
  documentContentsNonPII,
  documentContentsPII,
  makeCSRUID
} from "../util/sample_data";
import { createSplitSql } from "../../src/util/sql";
import { defineSnifflesModels } from "../../src/models/db/sniffles";
import { createTestSessionStore } from "../../src/endpoints/webPortal/endpoint";
import { WinstonBuffer } from "../util/winstonBuffer";
import logger from "../../src/util/logger";

describe("putDocument", () => {
  let sql;
  let publicApp;
  let models;
  let accessKey;
  let logBuffer;

  beforeAll(async done => {
    sql = createSplitSql();
    const sessionStore = createTestSessionStore(sql);
    publicApp = await createPublicApp({ sql, sessionStore });
    models = defineSnifflesModels(sql);

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

  beforeEach(done => {
    logBuffer = new WinstonBuffer();
    logger.add(logBuffer);
    done();
  });

  afterEach(done => {
    logger.remove(logBuffer);
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

    const visit = await models.visitNonPii.findOne({ where: { csruid } });
    expect(visit.device).not.toEqual(contents.device);
    expect(visit.device).toEqual({ info: "���" });
    await visit.destroy();

    await models.visitPii.destroy({ where: { csruid } });
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

    const visitNonPii = await models.visitNonPii.findOne({
      where: { csruid }
    });
    expect(visitNonPii.csruid).toEqual(csruid);
    expect(visitNonPii.device).toEqual(contentsPost.device);
    expect(visitNonPii.visit).toEqual(VISIT_NONPII);
    await visitNonPii.destroy();

    const visitPii = await models.visitPii.findOne({ where: { csruid } });
    expect(visitPii.csruid).toEqual(csruid);
    expect(visitPii.visit).toEqual(VISIT_PII);
    await visitPii.destroy();
  });

  it("updates existing documents in visits table in PII db", async () => {
    const csruid = makeCSRUID(
      "updates existing documents in visits table in PII db"
    );
    const contentsPost = documentContentsPost(csruid);
    const contentsNonPII = documentContentsNonPII(csruid);
    const contentsPII = documentContentsPII(csruid);

    await models.visitNonPii.upsert(contentsNonPII);
    await models.visitPii.upsert(contentsPII);

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

    const newPIIVisit = await models.visitPii.findOne({
      where: { csruid }
    });
    const newVisitDoc = newPIIVisit.visit as VisitInfo;
    expect(newVisitDoc.patient.name).toEqual("New Fake Name");
    expect(newVisitDoc).toEqual({ ...VISIT_PII, patient: newPatient });
    await newPIIVisit.destroy();

    const newNonPIIVisit = await models.visitNonPii.findOne({
      where: { csruid }
    });
    expect(newNonPIIVisit.visit).toEqual(contentsNonPII.visit);
    await newNonPIIVisit.destroy();
  });

  it("logs http interactions", async () => {
    const csruid = makeCSRUID("logs http interactions");
    const contentsPost = documentContentsPost(csruid);

    await request(publicApp)
      .put(`/api/documents/${accessKey.key}/${csruid}`)
      .send(contentsPost)
      .expect(200);

    const logs = logBuffer.consume();
    const lines = logs
      .map(x => x.message)
      .filter(x => x.indexOf("@sniffles") >= 0)
      .filter(x => x.indexOf(csruid) >= 0);
    expect(lines).toHaveLength(1);
    const line: string = lines[0];
    expect(line.indexOf(DocumentType.Visit)).toBeGreaterThan(0);
    expect(line.indexOf(DEVICE.installation)).toBeGreaterThan(0);

    const where = { where: { csruid } };
    await Promise.all([
      models.visitNonPii.destroy(where),
      models.visitPii.destroy(where),
    ])
  });

  it("logs invalid http interactions", async () => {
    const csruid = makeCSRUID("logs invalid http interactions");
    const contentsPost = documentContentsPost(csruid);
    delete contentsPost.device;

    await request(publicApp)
      .put(`/api/documents/${accessKey.key}/${csruid}`)
      .send(contentsPost)
      .expect(500);

    const logs = logBuffer.consume();
    const lines = logs
      .map(x => x.message)
      .filter(x => x.indexOf("@sniffles") >= 0)
      .filter(x => x.indexOf(csruid) >= 0);
    expect(lines).toHaveLength(1);
    const line: string = lines[0];
    expect(line.indexOf(DocumentType.Visit)).toBeGreaterThan(0);
    expect(line.indexOf("guard caught")).toBeGreaterThan(0);
  });
});

describe("putDocumentWithKey", () => {
  let sql;
  let publicApp;
  let models;
  beforeAll(async done => {
    sql = createSplitSql();
    const sessionStore = createTestSessionStore(sql);
    publicApp = await createPublicApp({ sql, sessionStore });
    models = defineSnifflesModels(sql);
    done();
  });

  afterAll(async done => {
    await sql.close();
    done();
  });

  it("accepts a docuent with a valid key", async () => {
    const csruid = makeCSRUID("accepts a docuent with a valid key");
    const contentsPost = documentContentsPost(csruid);

    const accessKey = await models.accessKey.create({
      key: "accesskey1",
      valid: true
    });

    await request(publicApp)
      .put(`/api/documents/${accessKey.key}/${csruid}`)
      .send(contentsPost)
      .expect(200);

    const newVisitNonPII = await models.visitNonPii.findOne({
      where: { csruid }
    });
    expect(newVisitNonPII).not.toBeNull();

    const newVisitPII = await models.visitPii.findOne({
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

    const accessKey = await models.accessKey.create({
      key: "accesskey2",
      valid: true
    });

    await request(publicApp)
      .put(`/api/documents/notaccesskey2/${csruid}`)
      .send(contentsPost)
      .expect(404);

    const newVisitNonPII = await models.visitNonPii.findOne({
      where: { csruid }
    });
    expect(newVisitNonPII).toBeNull();

    const newVisitPII = await models.visitPii.findOne({
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

    const accessKey = await models.accessKey.create({
      key: "accesskey3",
      valid: false
    });

    await request(publicApp)
      .put(`/api/documents/${accessKey.key}/${csruid}`)
      .send(contentsPost)
      .expect(404);

    const newVisitNonPII = await models.visitNonPii.findOne({
      where: { csruid }
    });
    expect(newVisitNonPII).toBeNull();

    const newVisitPII = await models.visitPii.findOne({
      where: { csruid }
    });
    expect(newVisitPII).toBeNull();

    await accessKey.destroy();
  });
});
