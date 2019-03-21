// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import request from "supertest";
import { createPublicApp } from "../../src/app";
import Sequelize from "sequelize";
import {
  makeCSRUID,
  surveyPost,
  surveyNonPIIInDb,
  surveyPIIInDb
} from "../endpoints/feverSampleData";

import {
  SurveyUpdater,
  SurveyNonPIIUpdater,
  SurveyPIIUpdater
} from "../../scripts/util/feverSurveyUpdater";
import { ScriptLogger } from "../../scripts/util/script_logger";
import { SurveyDocument } from "audere-lib/feverProtocol";
import { createSplitSql } from "../../src/util/sql";
import { defineFeverModels, SurveyAttributes } from "../../src/models/db/fever";
import { createTestSessionStore } from "../../src/endpoints/webPortal/endpoint";

describe("SurveyUpdater", () => {
  let sql;
  let publicApp;
  let models;
  let accessKey;

  const logs: String[] = [];
  const log = new ScriptLogger(s => logs.push(s));
  // const log = new ScriptLogger(console.log);

  const sequelizeNonPII = new Sequelize(process.env.NONPII_DATABASE_URL, {
    logging: false
  });
  const updaterNonPII = new SurveyNonPIIUpdater(sequelizeNonPII, log);

  const sequelizePII = new Sequelize(process.env.PII_DATABASE_URL, {
    logging: false
  });
  const updaterPII = new SurveyPIIUpdater(sequelizePII, log);

  async function cleanup(...csruids: string[]): Promise<void> {
    await Promise.all([
      updaterNonPII.cleanupForTesting(...csruids),
      updaterPII.cleanupForTesting(...csruids)
    ]);
  }

  beforeAll(async done => {
    log.setVerbose(true);
    sql = createSplitSql();
    const sessionStore = createTestSessionStore(sql);
    publicApp = await createPublicApp({ sql, sessionStore });
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

  it("can setDemo on non-PII", async () => {
    const csruid = makeCSRUID("can setDemo on non-PII");
    await checkSetDemo(
      csruid,
      surveyPost(csruid),
      surveyNonPIIInDb(csruid),
      updaterNonPII,
      survey => survey.isDemo
    );
  });

  it("can setDemo on PII", async () => {
    const csruid = makeCSRUID("can setDemo on PII");
    await checkSetDemo(
      csruid,
      surveyPost(csruid),
      surveyPIIInDb(csruid),
      updaterPII,
      survey => survey.isDemo
    );
  });

  async function checkSetDemo<T extends object>(
    csruid: string,
    contentsPost: SurveyDocument,
    contentsDb: SurveyAttributes<T>,
    updater: SurveyUpdater<T>,
    getIsDemo: (T) => boolean
  ): Promise<void> {
    await request(publicApp)
      .put(`/api/fever/documents/${accessKey.key}/${csruid}`)
      .send(contentsPost)
      .expect(200);

    const doc0 = await updater.load(csruid);
    expect(getIsDemo(doc0.survey)).toBe(false);
    const didChange0 = await updater.setDemo(doc0, true);
    expect(didChange0).toBe(true);

    const doc1 = await updater.load(csruid);
    expect(getIsDemo(doc1.survey)).toBe(true);
    const didChange1 = await updater.setDemo(doc1, true);
    expect(didChange1).toBe(false);

    const doc2 = await updater.load(csruid);
    expect(getIsDemo(doc2.survey)).toBe(true);
    const didChange2 = await updater.setDemo(doc2, false);
    expect(didChange2).toBe(true);

    const doc3 = await updater.load(csruid);
    expect(getIsDemo(doc3.survey)).toBe(false);
    expect(doc3.csruid).toEqual(csruid);
    expect(doc3.device).toEqual(contentsDb.device);
    expect(doc3.survey).toEqual(contentsDb.survey);

    await cleanup(csruid);
  }

  it("backs up non-PII", async () => {
    const csruid = makeCSRUID("backs up non-PII");
    await checkBackup(
      csruid,
      surveyPost(csruid),
      surveyNonPIIInDb(csruid),
      updaterNonPII
    );
  });

  it("backs up PII", async () => {
    const csruid = makeCSRUID("backs up PII");
    await checkBackup(
      csruid,
      surveyPost(csruid),
      surveyPIIInDb(csruid),
      updaterPII
    );
  });

  async function checkBackup<T extends object>(
    csruid: string,
    contentsPost: SurveyDocument,
    contentsDb: SurveyAttributes<T>,
    updater: SurveyUpdater<T>
  ): Promise<void> {
    await cleanup(csruid);
    await request(publicApp)
      .put(`/api/fever/documents/${accessKey.key}/${csruid}`)
      .send(contentsPost)
      .expect(200);

    const doc0 = await updater.load(csruid);
    expect(doc0.csruid).toEqual(contentsDb.csruid);
    expect(doc0.device).toEqual(contentsDb.device);
    expect(doc0.survey).toEqual(contentsDb.survey);

    const didChange0 = await updater.setDemo(doc0, true);
    expect(didChange0).toBe(true);

    const backups0 = await updater.loadBackups(csruid);
    expect(backups0.length).toEqual(1);
    expect(backups0[0].csruid).toEqual(contentsDb.csruid);
    expect(backups0[0].device).toEqual(contentsDb.device);
    expect(backups0[0].survey).toEqual(contentsDb.survey);

    await cleanup(csruid);
  }
});
