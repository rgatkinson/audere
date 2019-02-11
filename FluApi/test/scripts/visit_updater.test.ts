// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import request from "supertest";
import { publicApp } from "../../src/app";
import Sequelize from "sequelize";
import { VisitAttributes } from "../../src/models/visit";
import { AccessKey } from "../../src/models/accessKey";
import {
  makeCSRUID,
  documentContentsPost,
  documentContentsNonPII,
  documentContentsPII
} from "../util/sample_data";

import {
  VisitUpdater,
  VisitNonPIIUpdater,
  VisitPIIUpdater
} from "../../scripts/util/visit_updater";
import { ScriptLogger } from "../../scripts/util/script_logger";
import { VisitDocument } from "audere-lib/snifflesProtocol";

describe("VisitUpdater", () => {
  let accessKey;

  const logs: String[] = [];
  const log = new ScriptLogger(s => logs.push(s));
  // const log = new ScriptLogger(console.log);

  const sequelizeNonPII = new Sequelize(process.env.NONPII_DATABASE_URL, {
    logging: false
  });
  const updaterNonPII = new VisitNonPIIUpdater(sequelizeNonPII, log);

  const sequelizePII = new Sequelize(process.env.PII_DATABASE_URL, {
    logging: false
  });
  const updaterPII = new VisitPIIUpdater(sequelizePII, log);

  async function cleanup(...csruids: string[]): Promise<void> {
    await Promise.all([
      updaterNonPII.cleanupForTesting(...csruids),
      updaterPII.cleanupForTesting(...csruids)
    ]);
  }

  beforeAll(async done => {
    log.setVerbose(true);
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

  it("can setDemo on non-PII", async () => {
    const csruid = makeCSRUID("can setDemo on non-PII");
    await checkSetDemo(
      csruid,
      documentContentsPost(csruid),
      documentContentsNonPII(csruid),
      updaterNonPII,
      visit => visit.isDemo
    );
  });

  it("can setDemo on PII", async () => {
    const csruid = makeCSRUID("can setDemo on PII");
    await checkSetDemo(
      csruid,
      documentContentsPost(csruid),
      documentContentsPII(csruid),
      updaterPII,
      visit => visit.isDemo
    );
  });

  async function checkSetDemo<T extends object>(
    csruid: string,
    contentsPost: VisitDocument,
    contentsDb: VisitAttributes<T>,
    updater: VisitUpdater<T>,
    getIsDemo: (T) => boolean
  ): Promise<void> {
    await request(publicApp)
      .put(`/api/documents/${accessKey.key}/${csruid}`)
      .send(contentsPost)
      .expect(200);

    const doc0 = await updater.load(csruid);
    expect(getIsDemo(doc0.visit)).toBe(false);
    const didChange0 = await updater.setDemo(doc0, true);
    expect(didChange0).toBe(true);

    const doc1 = await updater.load(csruid);
    expect(getIsDemo(doc1.visit)).toBe(true);
    const didChange1 = await updater.setDemo(doc1, true);
    expect(didChange1).toBe(false);

    const doc2 = await updater.load(csruid);
    expect(getIsDemo(doc2.visit)).toBe(true);
    const didChange2 = await updater.setDemo(doc2, false);
    expect(didChange2).toBe(true);

    const doc3 = await updater.load(csruid);
    expect(getIsDemo(doc3.visit)).toBe(false);
    expect(doc3.csruid).toEqual(csruid);
    expect(doc3.device).toEqual(contentsDb.device);
    expect(doc3.visit).toEqual(contentsDb.visit);

    await cleanup(csruid);
  }

  it("backs up non-PII", async () => {
    const csruid = makeCSRUID("backs up non-PII");
    await checkBackup(
      csruid,
      documentContentsPost(csruid),
      documentContentsNonPII(csruid),
      updaterNonPII
    );
  });

  it("backs up PII", async () => {
    const csruid = makeCSRUID("backs up PII");
    await checkBackup(
      csruid,
      documentContentsPost(csruid),
      documentContentsPII(csruid),
      updaterPII
    );
  });

  async function checkBackup<T extends object>(
    csruid: string,
    contentsPost: VisitDocument,
    contentsDb: VisitAttributes<T>,
    updater: VisitUpdater<T>
  ): Promise<void> {
    await cleanup(csruid);
    await request(publicApp)
      .put(`/api/documents/${accessKey.key}/${csruid}`)
      .send(contentsPost)
      .expect(200);

    const doc0 = await updater.load(csruid);
    expect(doc0.csruid).toEqual(contentsDb.csruid);
    expect(doc0.device).toEqual(contentsDb.device);
    expect(doc0.visit).toEqual(contentsDb.visit);

    const didChange0 = await updater.setDemo(doc0, true);
    expect(didChange0).toBe(true);

    const backups0 = await updater.loadBackups(csruid);
    expect(backups0.length).toEqual(1);
    expect(backups0[0].csruid).toEqual(contentsDb.csruid);
    expect(backups0[0].device).toEqual(contentsDb.device);
    expect(backups0[0].visit).toEqual(contentsDb.visit);

    await cleanup(csruid);
  }
});
