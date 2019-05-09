// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { anything, instance, mock, when } from "ts-mockito";
import request from "supertest";
import { createPublicApp } from "../../src/app";
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
import { createSplitSql } from "../../src/util/sql";
import {
  defineSnifflesModels,
  VisitAttributes
} from "../../src/models/db/sniffles";
import { createTestSessionStore } from "../../src/endpoints/webPortal/endpoint";
import { EncounterDetailsService } from "../../src/services/encounterDetailsService";
import { defineHutchUpload } from "../../src/models/db/hutchUpload";
import { GeocodingService } from "../../src/services/geocodingService";
import { HutchUploader } from "../../src/external/hutchUploader";
import { EncountersService } from "../../src/services/encountersService";
import { setPart } from "../../scripts/util/pathEdit";
import { defineFeverModels } from "../../src/models/db/fever";

describe("VisitUpdater", () => {
  let sql;
  let updaterNonPII;
  let updaterPII;
  let publicApp;
  let feverModels;
  let snifflesModels;
  let hutchUploadModel;
  let accessKey;

  const logs: String[] = [];
  const log = new ScriptLogger(s => logs.push(s));

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
    updaterNonPII = new VisitNonPIIUpdater(sql, log);
    updaterPII = new VisitPIIUpdater(sql, log);
    feverModels = defineFeverModels(sql);
    snifflesModels = defineSnifflesModels(sql);
    hutchUploadModel = defineHutchUpload(sql);
    accessKey = await snifflesModels.accessKey.create({
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

  it("clears upload for pii", async () => {
    const csruid0 = makeCSRUID("0 clears upload for pii");
    const csruid1 = makeCSRUID("1 clears upload for pii");
    const contents0 = documentContentsPost(csruid0);
    const contents1 = documentContentsPost(csruid1);
    const updater = new VisitPIIUpdater(sql, log);
    await checkClearUpload(csruid0, contents0, csruid1, contents1, updater);
  });

  it("clears upload for non-pii", async () => {
    const csruid0 = makeCSRUID("0 clears upload for non-pii");
    const csruid1 = makeCSRUID("1 clears upload for non-pii");
    const contents0 = documentContentsPost(csruid0);
    const contents1 = documentContentsPost(csruid1);
    const updater = new VisitNonPIIUpdater(sql, log);
    await checkClearUpload(csruid0, contents0, csruid1, contents1, updater);
  });

  // NOTE: contents{0,1} needs:
  // - complete=true
  // - events contains something with CompletedQuestionnaire
  async function checkClearUpload<T extends object>(
    csruid0: string,
    contents0: VisitDocument,
    csruid1: string,
    contents1: VisitDocument,
    updater: VisitUpdater<T>
  ): Promise<void> {
    await cleanup(csruid0, csruid1);

    await request(publicApp)
      .put(`/api/documents/${accessKey.key}/${csruid0}`)
      .send(contents0)
      .expect(200);
    await request(publicApp)
      .put(`/api/documents/${accessKey.key}/${csruid1}`)
      .send(contents1)
      .expect(200);

    const encountersService = createDbEncountersService();

    // Since we added two visits, we should send both.
    const send0 = await encountersService.sendEncounters();

    const doc0 = await updater.load(csruid0);
    expect(doc0.csruid).toEqual(csruid0);

    await updater.updateItem(
      doc0,
      setPart(doc0.visit, ["location"], "New Location")
    );

    // After editing one of the visits, we should resend.
    const send1 = await encountersService.sendEncounters();

    await cleanup(csruid0, csruid1);
  }

  function createDbEncountersService() {
    const MockGeocodingService = mock(GeocodingService);
    when(MockGeocodingService.geocodeAddresses(anything())).thenResolve([]);
    const api: any = { post: () => Promise.resolve() };
    const hutchUploader = new HutchUploader(api, 20, "User", "Password");
    const encounterDetails = new EncounterDetailsService(
      feverModels,
      snifflesModels,
      hutchUploadModel
    );
    return new EncountersService(
      instance(MockGeocodingService),
      hutchUploader,
      encounterDetails,
      "abc"
    );
  }
});
