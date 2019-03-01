// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { BatchAttributes, BatchItemAttributes, defineIncentiveBatch, defineIncentiveItem, SurveyModel, defineSurvey, BatchDiscardAttributes, defineIncentiveDiscard } from "../../src/models/fever";
import { createSplitSql, Inst, Model, SplitSql } from "../../src/util/sql";
import { SurveyNonPIIInfo } from "audere-lib/feverProtocol";
import { surveyNonPIIInDb } from "../endpoints/feverSampleData";
import { IncentiveRecipientsDataAccess, INCENTIVES_BATCH_NAMESPACE, INCENTIVES_ITEMS_NAMESPACE } from "../../src/services/feverApi/incentiveRecipients";
import { defineGaplessSeq, GaplessSeqAttributes } from "../../src/models/gaplessSeq";

describe("survey batch data access", () => {
  let sql: SplitSql;
  let incentiveBatch: Model<BatchAttributes>;
  let incentiveItems: Model<BatchItemAttributes>;
  let incentiveDiscard: Model<BatchDiscardAttributes>;
  let nonPii: SurveyModel<SurveyNonPIIInfo>;
  let seq: Model<GaplessSeqAttributes>;

  let batchSeq: Inst<GaplessSeqAttributes>;
  let itemSeq: Inst<GaplessSeqAttributes>;

  let cleanup: (() => Promise<void>)[] = [];

  beforeAll(async done => {
    sql = createSplitSql();
    incentiveBatch = defineIncentiveBatch(sql.nonPii);
    incentiveItems = defineIncentiveItem(sql.nonPii);
    incentiveDiscard = defineIncentiveDiscard(sql.nonPii);
    nonPii = defineSurvey(sql.nonPii);
    seq = defineGaplessSeq(sql);
    done();
  });

  afterAll(async done => {
    await sql.close();
    done();
  });

  beforeEach(async () => {
    batchSeq = await seq.find({
      where: { name: INCENTIVES_BATCH_NAMESPACE }
    });

    itemSeq = await seq.find({
      where: { name: INCENTIVES_ITEMS_NAMESPACE }
    });
  });

  afterEach(async () => {
    cleanup.push(async () => {
      await incentiveBatch.destroy({ where: {} });
    });

    cleanup.push(async () => {
      await incentiveItems.destroy({ where: {} });
    });

    cleanup.push(async () => {
      await incentiveDiscard.destroy({ where: {} });
    });

    // Reset the sequences as part of cleanup.
    cleanup.push(async () => {
      await batchSeq.update({ index: 0 });
    });

    cleanup.push(async () => {
      await itemSeq.update({ index: 0 });
    });

    await Promise.all(cleanup.map(x => x()));
    cleanup = [];
  });

  async function createTestData(
    batchUploaded: boolean = true,
    surveyComplete: boolean = true
  ): Promise<void> {
    const surveys = [
      JSON.parse(JSON.stringify(surveyNonPIIInDb("0"))),
      JSON.parse(JSON.stringify(surveyNonPIIInDb("1"))),
      JSON.parse(JSON.stringify(surveyNonPIIInDb("2"))),
      JSON.parse(JSON.stringify(surveyNonPIIInDb("3")))
    ];
    const now = new Date().toISOString();
    if (surveyComplete) {
      surveys.forEach(s => s.survey.workflow.surveyCompletedAt = now);
    }
    const s = await nonPii.bulkCreate(surveys, { returning: true });

    await incentiveBatch.create({
      id: 1,
      uploaded: batchUploaded
    });

    const batchKeys = Array.from(s.keys()).slice(0, 2);
    const batchItems = batchKeys.map(i => ({
      id: i,
      batchId: 1,
      surveyId: +s[i].id
    }));
    await incentiveItems.bulkCreate(batchItems);

    s.forEach(x => cleanup.push(
      async () => await x.destroy()
    ));
  }

  describe("get existing batch", async () => {
    it("should retrieve existing batches", async () => {
      const dao = new IncentiveRecipientsDataAccess(sql);
      await createTestData(false);

      const out = await dao.getExistingBatch();

      expect(out.id).toBe(1);
      expect(out.items).toHaveLength(2);
      [0, 1].forEach(key =>
        expect(out.items).toContainEqual(expect.objectContaining({
          workflowId: key,
          csruid: key.toString()
        }))
      );
    });
  
    it("should return null if no pending batch is present", async () => {
      const dao = new IncentiveRecipientsDataAccess(sql);
      await createTestData();

      const out = await dao.getExistingBatch();

      expect(out).toBeNull();
    });
  });

  describe("get new batch items", () => {
    it("should retrieve unassigned items", async () => {
      const dao = new IncentiveRecipientsDataAccess(sql);
      await createTestData();

      const out = await dao.getNewBatchItems(); 
      
      expect(out).toHaveLength(2);
      [2, 3].forEach(key =>
        expect(out).toContainEqual(expect.objectContaining({
          csruid: key.toString()
        }))
      );
    });

    it("should not retrieve surveys that are incomplete", async () => {
      const dao = new IncentiveRecipientsDataAccess(sql);
      await createTestData(true, false);

      const out = await dao.getNewBatchItems(); 
      
      expect(out).toBeNull();
    });
  });

  describe("track batch", () => {
    it("creates a new batch and assigns sequential ids to items", async () => {
      const dao = new IncentiveRecipientsDataAccess(sql);
      await createTestData();

      // Modify the sequences to offset the expected output ids.
      await batchSeq.update({ index: 2 });
      await itemSeq.update({ index: 45 });

      const items = await dao.getNewBatchItems();
      const batch = await dao.trackBatch(items);

      expect(batch.id).toBe(3);
      expect(batch.items).toHaveLength(2);
      expect(batch.items).toContainEqual(expect.objectContaining({
        workflowId: 46
      }));
      expect(batch.items).toContainEqual(expect.objectContaining({
        workflowId: 47
      }));
    });
  });

  describe("commit batch upload", () => {
    it("marks a batch as uploaded", async () => {
      const dao = new IncentiveRecipientsDataAccess(sql);
      await createTestData(false);

      await dao.commitUploadedBatch(1, []);

      const batch = await incentiveBatch.find({
        where: { id: 1 }
      });

      expect(batch).not.toBeNull();
      expect(batch.uploaded).toBe(true);
    });

    it("records discarded items", async () => {
      const dao = new IncentiveRecipientsDataAccess(sql);
      await createTestData(false);

      await batchSeq.update({ index: 1 });
      await itemSeq.update({ index: 45 });
      const items = await dao.getNewBatchItems();
      const batch = await dao.trackBatch(items);
      const itemIds = batch.items.map(x => x.workflowId);
      await dao.commitUploadedBatch(batch.id, itemIds);

      const db = await incentiveBatch.find({
        where: { id: batch.id }
      });

      expect(db).not.toBeNull();
      expect(db.uploaded).toBe(true);

      const discarded = await incentiveDiscard.findAll({
        where: { batchId: batch.id }
      });

      expect(discarded).toHaveLength(2);
      itemIds.forEach(id => {
        expect(discarded).toContainEqual(expect.objectContaining({
          workflowId: id
        }));
      });

      discarded.forEach(d => cleanup.push(async () => await d.destroy()));
    });
  });
});