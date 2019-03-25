// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import _ from "lodash";
import {
  BatchAttributes,
  BatchItemAttributes,
  defineKitBatch,
  defineKitItem,
  SurveyModel,
  defineSurvey,
  BatchDiscardAttributes,
  defineKitDiscard
} from "../../src/models/db/fever";
import { createSplitSql, Inst, Model, SplitSql } from "../../src/util/sql";
import { SurveyNonPIIInfo } from "audere-lib/feverProtocol";
import { surveyNonPIIInDb } from "../endpoints/feverSampleData";
import {
  defineGaplessSeq,
  GaplessSeqAttributes
} from "../../src/models/db/gaplessSeq";
import {
  KitRecipientsDataAccess,
  KIT_BATCH_NAMESPACE,
  KIT_ITEMS_NAMESPACE
} from "../../src/services/fever/kitOrdersData";

describe("survey batch data access", () => {
  let sql: SplitSql;
  let kitBatch: Model<BatchAttributes>;
  let kitItems: Model<BatchItemAttributes>;
  let kitDiscard: Model<BatchDiscardAttributes>;
  let nonPii: SurveyModel<SurveyNonPIIInfo>;
  let seq: Model<GaplessSeqAttributes>;

  let batchSeq: Inst<GaplessSeqAttributes>;
  let itemSeq: Inst<GaplessSeqAttributes>;

  beforeAll(async done => {
    sql = createSplitSql();
    kitBatch = defineKitBatch(sql.nonPii);
    kitItems = defineKitItem(sql.nonPii);
    kitDiscard = defineKitDiscard(sql.nonPii);
    nonPii = defineSurvey(sql.nonPii);
    seq = defineGaplessSeq(sql);

    batchSeq = await seq.find({
      where: { name: KIT_BATCH_NAMESPACE }
    });

    itemSeq = await seq.find({
      where: { name: KIT_ITEMS_NAMESPACE }
    });

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
      batchSeq.update({ index: 0 }).then(() => {}),
      itemSeq.update({ index: 0 }).then(() => {})
    ]);

    await kitBatch.destroy({ where: {} }).then(() => {});
  }

  async function createTestData(
    batchUploaded: boolean = true,
    screeningComplete: boolean = true,
    demoRecords: string[] = []
  ): Promise<void> {
    const surveys = [
      _.cloneDeep(surveyNonPIIInDb("0")),
      _.cloneDeep(surveyNonPIIInDb("1")),
      _.cloneDeep(surveyNonPIIInDb("2")),
      _.cloneDeep(surveyNonPIIInDb("3"))
    ];
    if (!screeningComplete) {
      surveys.forEach(
        s => (s.survey.workflow.screeningCompletedAt = undefined)
      );
    }
    surveys.forEach(s => {
      if (demoRecords.includes(s.csruid)) {
        s.survey.isDemo = true;
      }
    });
    const s = await nonPii.bulkCreate(surveys, { returning: true });

    await kitBatch.create({
      id: 1,
      uploaded: batchUploaded
    });

    const batchKeys = Array.from(s.keys()).slice(0, 2);
    const batchItems = batchKeys.map(i => ({
      id: i,
      batchId: 1,
      surveyId: +s[i].id
    }));
    await kitItems.bulkCreate(batchItems);
  }

  describe("get existing batch", async () => {
    it("should retrieve existing batches", async () => {
      const dao = new KitRecipientsDataAccess(sql);
      await createTestData(false);

      const out = await dao.getExistingBatch();

      expect(out.id).toBe(1);
      expect(out.items).toHaveLength(2);
      [0, 1].forEach(key =>
        expect(out.items).toContainEqual(
          expect.objectContaining({
            workflowId: key
          })
        )
      );
    });

    it("should return null if no pending batch is present", async () => {
      const dao = new KitRecipientsDataAccess(sql);
      await createTestData();

      const out = await dao.getExistingBatch();

      expect(out).toBeNull();
    });
  });

  describe("get new batch items", () => {
    it("should retrieve unassigned items", async () => {
      const dao = new KitRecipientsDataAccess(sql);
      await createTestData();

      const out = await dao.getNewItems();

      expect(out).toHaveLength(2);
      [2, 3].forEach(key =>
        expect(out).toContainEqual(
          expect.objectContaining({
            csruid: key.toString()
          })
        )
      );
    });

    it("should not retrieve surveys that are incomplete", async () => {
      const dao = new KitRecipientsDataAccess(sql);
      await createTestData(true, false);

      const out = await dao.getNewItems();

      expect(out).toBeNull();
    });

    it("should filter demo surveys", async () => {
      const dao = new KitRecipientsDataAccess(sql);
      await createTestData(true, true, ["3"]);

      const out = await dao.getNewItems();

      expect(out).toHaveLength(1);
      expect(out).toContainEqual(
        expect.objectContaining({
          csruid: "2"
        })
      );
    });
  });

  describe("get existing items", () => {
    it("should fetch items based on a list of ids", async () => {
      const dao = new KitRecipientsDataAccess(sql);
      await createTestData(false);

      const batch = await dao.getExistingBatch();
      const out = await dao.getExistingItems(batch.items);

      expect(out).toHaveLength(2);
      expect(out).toContainEqual(
        expect.objectContaining({
          csruid: "0"
        })
      );
      expect(out).toContainEqual(
        expect.objectContaining({
          csruid: "1"
        })
      );      
    });
  });

  describe("track batch", () => {
    it("creates a new batch and assigns sequential ids to items", async () => {
      const dao = new KitRecipientsDataAccess(sql);
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
          workflowId: 46
        })
      );
      expect(batch.items).toContainEqual(
        expect.objectContaining({
          workflowId: 47
        })
      );
    });
  });

  describe("commit batch upload", () => {
    it("marks a batch as uploaded", async () => {
      const dao = new KitRecipientsDataAccess(sql);
      await createTestData(false);

      await dao.commitUploadedBatch(1, []);

      const batch = await kitBatch.find({
        where: { id: 1 }
      });

      expect(batch).not.toBeNull();
      expect(batch.uploaded).toBe(true);
    });

    it("records discarded items", async () => {
      const dao = new KitRecipientsDataAccess(sql);
      await createTestData(false);

      await batchSeq.update({ index: 1 });
      await itemSeq.update({ index: 45 });
      const items = await dao.getNewItems();
      const batch = await dao.trackBatch(items);
      const itemIds = batch.items.map(x => x.workflowId);
      await dao.commitUploadedBatch(batch.id, itemIds);

      const db = await kitBatch.find({
        where: { id: batch.id }
      });

      expect(db).not.toBeNull();
      expect(db.uploaded).toBe(true);

      const discarded = await kitDiscard.findAll({
        where: { batchId: batch.id }
      });

      expect(discarded).toHaveLength(2);
      itemIds.forEach(id => {
        expect(discarded).toContainEqual(
          expect.objectContaining({
            workflowId: id
          })
        );
      });
    });
  });
});
