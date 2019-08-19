// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import _ from "lodash";
import {
  BatchAttributes,
  BatchItemAttributes,
  SurveyModel,
  defineSurvey,
  BatchDiscardAttributes,
  ReceivedKitAttributes,
  defineReceivedKits,
  ReceivedKitsFileAttributes,
  defineReceivedKitsFiles,
  defineFollowUpBatch,
  defineFollowUpItem,
  defineFollowUpDiscard,
  FollowUpSurveyAttributes,
  defineFollowUpSurveys,
} from "../../src/models/db/fever";
import { Inst, Model, SplitSql } from "backend-lib";
import { getSql } from "../../src/util/sql";
import {
  PIIInfo,
  SurveyNonPIIInfo,
  TelecomInfoSystem,
} from "audere-lib/feverProtocol";
import { surveyNonPIIInDb, surveyPIIInDb } from "../endpoints/feverSampleData";
import {
  FollowUpDataAccess,
  FOLLOWUP_BATCH_NAMESPACE,
  FOLLOWUP_ITEMS_NAMESPACE,
} from "../../src/services/fever/followUpData";
import {
  defineGaplessSeq,
  GaplessSeqAttributes,
} from "../../src/models/db/gaplessSeq";
import {
  HutchUploadAttributes,
  defineHutchUpload,
} from "../../src/models/db/hutchUpload";

describe("survey batch data access", () => {
  let sql: SplitSql;
  let followUpBatch: Model<BatchAttributes>;
  let followUpItems: Model<BatchItemAttributes>;
  let followUpDiscard: Model<BatchDiscardAttributes>;
  let receivedKitFiles: Model<ReceivedKitsFileAttributes>;
  let receivedKits: Model<ReceivedKitAttributes>;
  let nonPii: SurveyModel<SurveyNonPIIInfo>;
  let pii: SurveyModel<PIIInfo>;
  let seq: Model<GaplessSeqAttributes>;
  let dao: FollowUpDataAccess;

  let batchSeq: Inst<GaplessSeqAttributes>;
  let itemSeq: Inst<GaplessSeqAttributes>;

  let hutchUpload: Model<HutchUploadAttributes>;
  let followUpSurveys: Model<FollowUpSurveyAttributes>;

  beforeAll(async done => {
    sql = getSql();
    followUpBatch = defineFollowUpBatch(sql.nonPii);
    followUpItems = defineFollowUpItem(sql.nonPii);
    followUpDiscard = defineFollowUpDiscard(sql.nonPii);
    receivedKitFiles = defineReceivedKitsFiles(sql.nonPii);
    receivedKits = defineReceivedKits(sql.nonPii);
    nonPii = defineSurvey(sql.nonPii);
    pii = defineSurvey(sql.pii);
    seq = defineGaplessSeq(sql);
    dao = new FollowUpDataAccess(
      sql,
      seq,
      followUpBatch,
      followUpItems,
      followUpDiscard
    );

    batchSeq = await seq.find({
      where: { name: FOLLOWUP_BATCH_NAMESPACE },
    });

    itemSeq = await seq.find({
      where: { name: FOLLOWUP_ITEMS_NAMESPACE },
    });

    hutchUpload = defineHutchUpload(sql);
    followUpSurveys = defineFollowUpSurveys(sql.pii);

    done();
  });

  afterAll(async done => {
    await cleanupDb();
    await sql.close();
    done();
  });

  beforeEach(async () => {
    await cleanupDb();
    batchSeq.reload();
    itemSeq.reload();
  });

  async function cleanupDb() {
    await Promise.all([
      nonPii.destroy({ where: {} }).then(() => {}),
      pii.destroy({ where: {} }).then(() => {}),
      batchSeq.update({ index: 0 }).then(() => {}),
      itemSeq.update({ index: 0 }).then(() => {}),
      followUpSurveys.destroy({ where: {} }).then(() => {}),
    ]);

    await Promise.all([
      followUpBatch.destroy({ where: {} }).then(() => {}),
      receivedKitFiles.destroy({ where: {} }).then(() => {}),
      hutchUpload.destroy({ where: {} }).then(() => {}),
    ]);
  }

  async function createTestData(
    batchUploaded: boolean = true,
    surveyComplete: boolean = true,
    kitsReceived: boolean = true,
    demoRecords: string[] = []
  ): Promise<void> {
    const surveys = [
      _.cloneDeep(surveyNonPIIInDb("0")),
      _.cloneDeep(surveyNonPIIInDb("1")),
      _.cloneDeep(surveyNonPIIInDb("2")),
      _.cloneDeep(surveyNonPIIInDb("3")),
    ];
    const now = new Date().toISOString();
    if (surveyComplete) {
      surveys.forEach(s => (s.survey.workflow.surveyCompletedAt = now));
    }
    surveys.forEach(s => {
      if (demoRecords.includes(s.csruid)) {
        s.survey.isDemo = true;
      }
    });
    const s = await nonPii.bulkCreate(surveys, { returning: true });

    await followUpBatch.create({
      id: 1,
      uploaded: batchUploaded,
    });

    const batchKeys = Array.from(s.keys()).slice(0, 2);
    const batchItems = batchKeys.map(i => ({
      id: i,
      batchId: 1,
      surveyId: +s[i].id,
    }));
    await followUpItems.bulkCreate(batchItems);

    if (kitsReceived) {
      const file = await receivedKitFiles.create(
        { file: "test.txt" },
        { returning: true }
      );

      const received = s.map(x => {
        return {
          surveyId: +x.id,
          fileId: file.id,
          boxBarcode: x.csruid.repeat(8),
          dateReceived: "1985-06-12",
          linked: true,
          recordId: +x.id,
        };
      });
      await receivedKits.bulkCreate(received);
    }
  }

  describe("get existing batch", () => {
    it("should retrieve existing batches", async () => {
      await createTestData(false);

      const out = await dao.getExistingBatch();

      expect(out.id).toBe(1);
      expect(out.items).toHaveLength(2);
      [0, 1].forEach(key =>
        expect(out.items).toContainEqual(
          expect.objectContaining({
            workflowId: key,
          })
        )
      );
    });

    it("should return null if no pending batch is present", async () => {
      await createTestData();

      const out = await dao.getExistingBatch();

      expect(out).toBeNull();
    });
  });

  describe("get new batch items", () => {
    it("should retrieve unassigned items", async () => {
      await createTestData();

      const out = await dao.getNewItems();

      expect(out).toHaveLength(2);
      [2, 3].forEach(key =>
        expect(out).toContainEqual(
          expect.objectContaining({
            csruid: key.toString(),
          })
        )
      );
    });

    it("should not retrieve surveys that are incomplete", async () => {
      await createTestData(true, false);

      const out = await dao.getNewItems();

      expect(out).toBeNull();
    });

    it("should return surveys that don't have a received kit", async () => {
      await createTestData(true, true, false);

      const out = await dao.getNewItems();

      expect(out).toHaveLength(2);
      [2, 3].forEach(key =>
        expect(out).toContainEqual(
          expect.objectContaining({
            csruid: key.toString(),
          })
        )
      );
    });

    it("should filter demo surveys", async () => {
      await createTestData(true, true, true, ["3"]);

      const out = await dao.getNewItems();

      expect(out).toHaveLength(1);
      expect(out).toContainEqual(
        expect.objectContaining({
          csruid: "2",
        })
      );
    });
  });

  describe("track batch", () => {
    it("creates a new batch and assigns sequential ids to items", async () => {
      await createTestData();

      // Modify the sequences to offset the expected output ids.
      await batchSeq.update({ index: 2 });
      await itemSeq.update({ index: 45 });

      const items = await dao.getNewItems();
      const batch = await dao.trackBatch(items);

      expect(batch.id).toBe(3);
      expect(batch.items).toHaveLength(2);
      expect(batch.items).toContainEqual(
        expect.objectContaining({
          workflowId: 46,
        })
      );
      expect(batch.items).toContainEqual(
        expect.objectContaining({
          workflowId: 47,
        })
      );
    });
  });

  describe("commit batch upload", () => {
    it("marks a batch as uploaded", async () => {
      await createTestData(false);

      await dao.commitUploadedBatch(1, []);

      const batch = await followUpBatch.find({
        where: { id: 1 },
      });

      expect(batch).not.toBeNull();
      expect(batch.uploaded).toBe(true);
    });

    it("records discarded items", async () => {
      await createTestData(false);

      await batchSeq.update({ index: 1 });
      await itemSeq.update({ index: 45 });
      const items = await dao.getNewItems();
      const batch = await dao.trackBatch(items);
      const itemIds = batch.items.map(x => x.workflowId);
      await dao.commitUploadedBatch(batch.id, itemIds);

      const db = await followUpBatch.find({
        where: { id: batch.id },
      });

      expect(db).not.toBeNull();
      expect(db.uploaded).toBe(true);

      const discarded = await followUpDiscard.findAll({
        where: { batchId: batch.id },
      });

      expect(discarded).toHaveLength(2);
      itemIds.forEach(id => {
        expect(discarded).toContainEqual(
          expect.objectContaining({
            workflowId: id,
          })
        );
      });
    });
  });

  describe("importing follow-up surveys", () => {
    const followUpData = {
      record_id: 1,
      email: "zaza@mail.com",
      daily_activity: 1,
      medications: 2,
      care___1: 0,
      care___2: 1,
      care___3: 0,
      care___4: 1,
      care___5: 0,
      care___6: 1,
      care___7: 0,
      care___8: 0,
      care_other: undefined,
      found_study: 3,
    };

    it("should store survey details", async () => {
      await dao.importFollowUpSurveys([followUpData]);

      const followUp = await followUpSurveys.findOne({
        where: {
          email: followUpData.email,
        },
      });

      expect(followUp.survey).toEqual(followUpData);
    });

    it("should reset the Hutch upload log for new follow-up records based on email", async () => {
      const piiSurveys = [
        _.cloneDeep(surveyPIIInDb("0")),
        _.cloneDeep(surveyPIIInDb("1")),
      ];
      piiSurveys.map(
        s =>
          (s.survey.patient.telecom = [
            {
              system: TelecomInfoSystem.Email,
              value: followUpData.email,
            },
          ])
      );
      await pii.bulkCreate(piiSurveys);

      const nonPiiSurveys = [
        _.cloneDeep(surveyNonPIIInDb("0")),
        _.cloneDeep(surveyNonPIIInDb("1")),
      ];
      const surveys = await nonPii.bulkCreate(nonPiiSurveys, {
        returning: true,
      });

      const uploads = surveys.map(n => ({
        surveyId: +n.id,
        visitId: undefined,
      }));
      await hutchUpload.bulkCreate(uploads);

      await dao.importFollowUpSurveys([followUpData]);

      const result = await hutchUpload.findAll({
        where: {
          surveyId: uploads.map(u => u.surveyId),
        },
      });

      expect(result).toHaveLength(0);
    });

    it("should not reset the Hutch upload log for existing records", async () => {
      await dao.importFollowUpSurveys([followUpData]);

      const piiSurveys = [
        _.cloneDeep(surveyPIIInDb("0")),
        _.cloneDeep(surveyPIIInDb("1")),
      ];
      piiSurveys.map(
        s =>
          (s.survey.patient.telecom = [
            {
              system: TelecomInfoSystem.Email,
              value: followUpData.email,
            },
          ])
      );
      await pii.bulkCreate(piiSurveys);

      const nonPiiSurveys = [
        _.cloneDeep(surveyNonPIIInDb("0")),
        _.cloneDeep(surveyNonPIIInDb("1")),
      ];
      const surveys = await nonPii.bulkCreate(nonPiiSurveys, {
        returning: true,
      });

      const uploads = surveys.map(n => ({
        surveyId: +n.id,
        visitId: undefined,
      }));
      await hutchUpload.bulkCreate(uploads);

      await dao.importFollowUpSurveys([followUpData]);

      const result = await hutchUpload.findAll({
        where: {
          surveyId: uploads.map(u => u.surveyId),
        },
      });

      expect(result).toHaveLength(2);
    });
  });
});
