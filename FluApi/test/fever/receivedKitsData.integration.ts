// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SplitSql } from "backend-lib";
import { getSql } from "../../src/util/sql";
import { FeverModels, defineFeverModels } from "../../src/models/db/fever";
import { ReceivedKitsData } from "../../src/services/fever/receivedKitsData";
import { surveyNonPIIInDb } from "../endpoints/feverSampleData";
import { EventInfoKind } from "audere-lib/feverProtocol";
import _ from "lodash";
import moment = require("moment");

describe("received kits data access", () => {
  let sql: SplitSql;
  let fever: FeverModels;

  beforeAll(async done => {
    sql = getSql();
    fever = defineFeverModels(sql);
    await cleanupDb();
    done();
  });

  afterEach(async () => {
    await cleanupDb();
  });

  async function cleanupDb() {
    await fever.surveyNonPii.destroy({ where: {} });
    await fever.receivedKitsFile.destroy({ where: {} });
    await fever.barcodes.destroy({ where: {} });
  }

  describe("find unlinked barcodes", () => {
    it("should exclude linked records", async () => {
      const file = await fever.receivedKitsFile.create(
        { file: "test.json" },
        { returning: true }
      );

      await fever.barcodes.bulkCreate([
        { barcode: "s1" },
        { barcode: "qwerty" },
      ]);

      // A linked record
      const s1 = _.cloneDeep(surveyNonPIIInDb("asdf"));
      s1.survey.samples.push({ sample_type: "manualEntry", code: "s1" });
      const db1 = await fever.surveyNonPii.create(s1);
      await fever.receivedKit.create({
        surveyId: +db1.id,
        fileId: file.id,
        boxBarcode: "s1",
        dateReceived: "2018-09-19",
        linked: true,
        recordId: +db1.id,
      });

      // An unlinked record
      const s2 = _.cloneDeep(surveyNonPIIInDb("qwerty"));
      s2.survey.samples.push({ sample_type: "manualEntry", code: "qwerty" });
      const db2 = await fever.surveyNonPii.create(s2);
      await fever.receivedKit.create({
        surveyId: +db2.id,
        fileId: file.id,
        boxBarcode: "qwerty",
        dateReceived: "2018-09-19",
        linked: false,
        recordId: +db2.id,
      });

      const dao = new ReceivedKitsData(sql);
      const unlinked = await dao.findUnlinkedBarcodes();

      // Only the unlinked record should be returned
      expect(unlinked.length).toBe(1);
      expect(unlinked[0].id).toBe(db2.id);
    });

    it("should avoid returning duplicate barcodes", async () => {
      const file = await fever.receivedKitsFile.create(
        { file: "test.json" },
        { returning: true }
      );

      await fever.barcodes.bulkCreate([{ barcode: "1" }, { barcode: "2" }]);

      // A track and untracked record
      const s1 = _.cloneDeep(surveyNonPIIInDb("asdf"));
      s1.survey.samples.push({ sample_type: "manualEntry", code: "1" });
      const db1 = await fever.surveyNonPii.create(s1);
      await fever.receivedKit.create({
        surveyId: +db1.id,
        fileId: file.id,
        boxBarcode: "1",
        dateReceived: "2018-09-19",
        linked: true,
        recordId: +db1.id,
      });

      const s2 = _.cloneDeep(surveyNonPIIInDb("qwerty"));
      s2.survey.samples.push({ sample_type: "manualEntry", code: "1" });
      await fever.surveyNonPii.create(s2);

      // Two untracked records
      const s3 = _.cloneDeep(surveyNonPIIInDb("dvorak"));
      s3.survey.samples.push({ sample_type: "manualEntry", code: "2" });
      await fever.surveyNonPii.create(s3);

      const s4 = _.cloneDeep(surveyNonPIIInDb("voltron"));
      s4.survey.samples.push({ sample_type: "manualEntry", code: "2" });
      s4.survey.events.push({
        kind: EventInfoKind.AppNav,
        at: new Date().toISOString(),
        refId: "ScanConfirmation",
      });
      const db4 = await fever.surveyNonPii.create(s4);

      const dao = new ReceivedKitsData(sql);
      const unlinked = await dao.findUnlinkedBarcodes();

      expect(unlinked.length).toBe(1);
      expect(unlinked[0].id).toBe(db4.id);
    });

    it("should match only manually entered or app scanned barcodes", async () => {
      const s1 = _.cloneDeep(surveyNonPIIInDb("asdf"));
      s1.survey.samples.push({ sample_type: "base64Value", code: "s1" });
      const s2 = _.cloneDeep(surveyNonPIIInDb("qwerty"));
      s2.survey.samples.push({ sample_type: "manualEntry", code: "qwerty" });

      const surveys = await fever.surveyNonPii.bulkCreate([s1, s2], {
        returning: true,
      });

      await fever.barcodes.bulkCreate([
        { barcode: "s1" },
        { barcode: "qwerty" },
      ]);

      const dao = new ReceivedKitsData(sql);
      const unlinked = await dao.findUnlinkedBarcodes();

      expect(unlinked.length).toBe(1);
      expect(unlinked[0]).toEqual(
        expect.objectContaining({
          id: +surveys[1].id,
          code: surveys[1].survey.samples.find(
            s => s.sample_type === "manualEntry"
          ).code,
          recordId: undefined,
        })
      );
    });

    it("should derive scan time from app nav scan events", async () => {
      const s = _.cloneDeep(surveyNonPIIInDb("asdf"));
      s.survey.samples.push({ sample_type: "manualEntry", code: "s1" });
      const now = new Date().toISOString();
      s.survey.events = [
        {
          kind: EventInfoKind.AppNav,
          at: now,
          refId: "ScanConfirmation",
        },
        {
          kind: EventInfoKind.AppNav,
          at: "Jibber jabber",
          refId: "Placebo",
        },
      ];

      await fever.surveyNonPii.create(s);
      await fever.barcodes.bulkCreate([{ barcode: "s1" }]);

      const dao = new ReceivedKitsData(sql);
      const barcodes = await dao.findUnlinkedBarcodes();

      expect(barcodes.length).toBe(1);
      expect(barcodes[0].scannedAt).toBe(now);
    });

    it("should derive scan time from app nav manual scan events", async () => {
      const s = _.cloneDeep(surveyNonPIIInDb("asdf"));
      s.survey.samples.push({ sample_type: "manualEntry", code: "s1" });
      const now = new Date().toISOString();
      s.survey.events = [
        {
          kind: EventInfoKind.AppNav,
          at: now,
          refId: "ManualConfirmation",
        },
        {
          kind: EventInfoKind.AppNav,
          at: "Jibber jabber",
          refId: "Placebo",
        },
      ];

      await fever.surveyNonPii.create(s);
      await fever.barcodes.bulkCreate([{ barcode: "s1" }]);

      const dao = new ReceivedKitsData(sql);
      const barcodes = await dao.findUnlinkedBarcodes();

      expect(barcodes.length).toBe(1);
      expect(barcodes[0].scannedAt).toBe(now);
    });

    it("should use the most recent scan time if there are multiple scan events", async () => {
      const s = _.cloneDeep(surveyNonPIIInDb("asdf"));
      s.survey.samples.push({ sample_type: "manualEntry", code: "s1" });
      const now = moment();
      s.survey.events = [
        {
          kind: EventInfoKind.AppNav,
          at: now.subtract(10, "days").toISOString(),
          refId: "ManualConfirmation",
        },
        {
          kind: EventInfoKind.AppNav,
          at: now.toISOString(),
          refId: "ScanConfirmation",
        },
      ];

      await fever.surveyNonPii.create(s);
      await fever.barcodes.bulkCreate([{ barcode: "s1" }]);

      const dao = new ReceivedKitsData(sql);
      const barcodes = await dao.findUnlinkedBarcodes();

      expect(barcodes.length).toBe(1);
      expect(barcodes[0].scannedAt).toBe(now.toISOString());
    });

    it("should filter out demo records and invalid barcodes", async () => {
      const s1 = _.cloneDeep(surveyNonPIIInDb("asdf"));
      s1.survey.samples.push({ sample_type: "manualEntry", code: "bad" });
      const s2 = _.cloneDeep(surveyNonPIIInDb("qwerty"));
      s2.survey.isDemo = true;
      s2.survey.samples.push({ sample_type: "manualEntry", code: "good" });

      await fever.surveyNonPii.bulkCreate([s1, s2], {
        returning: true,
      });
      await fever.barcodes.bulkCreate([{ barcode: "s1" }]);

      const dao = new ReceivedKitsData(sql);
      const barcodes = await dao.findUnlinkedBarcodes();

      expect(barcodes.length).toBe(0);
    });
  });

  describe("link kits", () => {
    it("should update an existing record", async () => {
      const barcode = "a1b2c3d4";

      const db = _.cloneDeep(surveyNonPIIInDb("asdf"));
      db.survey.workflow.surveyCompletedAt = new Date().toISOString();
      db.survey.samples.push({ sample_type: "scan", code: barcode });
      const survey = await fever.surveyNonPii.create(db, { returning: true });

      const record = {
        dateReceived: "2019-01-02",
        boxBarcode: barcode,
        utmBarcode: "aaaaaaaa",
        rdtBarcode: "bbbbbbbb",
        stripBarcode: "cccccccc",
        linked: false,
      };

      const dao = new ReceivedKitsData(sql);
      await dao.importReceivedKits(
        "test.json",
        new Map([[+survey.id, record]])
      );
      const mapping = { recordId: 127, surveyId: +survey.id };
      await dao.linkKits(new Map([[barcode, mapping]]));

      const kitRecord = await fever.receivedKit.findOne({
        where: {
          boxBarcode: barcode,
        },
      });

      expect(kitRecord.linked).toBe(true);
      expect(kitRecord.recordId).toBe(127);

      // Other fields unchanged
      expect(kitRecord.surveyId).toBe(+survey.id);
    });

    it("should insert a new record if there is no existing record to updated", async () => {
      const barcode = "a1b2c3d4";

      const db = _.cloneDeep(surveyNonPIIInDb("asdf"));
      db.survey.workflow.surveyCompletedAt = new Date().toISOString();
      db.survey.samples.push({ sample_type: "scan", code: barcode });
      const survey = await fever.surveyNonPii.create(db, { returning: true });

      const record = {
        dateReceived: "2019-01-02",
        boxBarcode: barcode,
        utmBarcode: "aaaaaaaa",
        rdtBarcode: "bbbbbbbb",
        stripBarcode: "cccccccc",
        linked: false,
      };

      const dao = new ReceivedKitsData(sql);
      const mapping = { recordId: 127, surveyId: +survey.id };
      await dao.linkKits(new Map([[barcode, mapping]]));

      const kitRecord = await fever.receivedKit.findOne({
        where: {
          boxBarcode: barcode,
        },
      });

      expect(kitRecord.linked).toBe(true);
      expect(kitRecord.recordId).toBe(127);
      expect(kitRecord.surveyId).toBe(+survey.id);
    });
  });

  describe("match barcodes", () => {
    it("should filter existing barcodes", async () => {
      const barcode = "12345678";
      const db = _.cloneDeep(surveyNonPIIInDb("asdf"));
      db.survey.samples.push({ sample_type: "scan", code: barcode });
      const survey = await fever.surveyNonPii.create(db, { returning: true });

      const file = await fever.receivedKitsFile.create(
        { file: "test.json" },
        { returning: true }
      );

      const kit = await fever.receivedKit.create(
        {
          surveyId: +survey.id,
          fileId: file.id,
          boxBarcode: barcode,
          dateReceived: "2018-09-19",
          linked: true,
          recordId: 55,
        },
        {
          returning: true,
        }
      );

      const dao = new ReceivedKitsData(sql);
      const matches = await dao.matchBarcodes([barcode]);

      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe(+survey.id);
      expect(matches[0].kitId).toBe(kit.id);
      expect(matches[0].recordId).toBe(55);
      expect(matches[0].fileId).toBe(file.id);
    });

    it("should match barcodes to sample code", async () => {
      const barcode = "a1b2c3d4";
      const db = _.cloneDeep(surveyNonPIIInDb("asdf"));
      db.survey.workflow.surveyCompletedAt = new Date().toISOString();
      db.survey.samples.push({ sample_type: "scan", code: barcode });
      const survey = await fever.surveyNonPii.create(db, { returning: true });

      const dao = new ReceivedKitsData(sql);
      const matches = await dao.matchBarcodes([barcode]);

      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe(survey.id);
      expect(matches[0].kitId).toBeNull();
    });

    it("should case-insensitive match barcodes to sample code", async () => {
      const barcode = "BARCODE1";
      const db = _.cloneDeep(surveyNonPIIInDb("asdf"));
      db.survey.workflow.surveyCompletedAt = new Date().toISOString();
      db.survey.samples.push({ sample_type: "scan", code: barcode });
      const survey = await fever.surveyNonPii.create(db, { returning: true });

      const dao = new ReceivedKitsData(sql);
      const matches = await dao.matchBarcodes([barcode.toLowerCase()]);

      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe(survey.id);
      expect(matches[0].kitId).toBeNull();
    });

    it("should error when attempting to match invalid barcodes", async () => {
      const dao = new ReceivedKitsData(sql);
      const result = dao.matchBarcodes(["ASDF"]);
      expect(result).rejects.toThrow();
    });
  });

  describe("import received kits", () => {
    it("should write file and kit data", async () => {
      const db = [surveyNonPIIInDb("asdf"), surveyNonPIIInDb("qwerty")];

      const surveys = await fever.surveyNonPii.bulkCreate(db, {
        returning: true,
      });

      const record1 = {
        dateReceived: "2019-01-02",
        boxBarcode: "12345678",
        utmBarcode: "aaaaaaaa",
        rdtBarcode: "bbbbbbbb",
        stripBarcode: "cccccccc",
        linked: true,
        recordId: 55,
      };

      const record2 = {
        dateReceived: "2017-03-12",
        boxBarcode: "abcdefgh",
        utmBarcode: "11111111",
        rdtBarcode: "22222222",
        stripBarcode: "33333333",
        linked: true,
        recordId: 66,
      };

      const records = new Map([
        [+surveys[0].id, record1],
        [+surveys[1].id, record2],
      ]);

      const dao = new ReceivedKitsData(sql);
      await dao.importReceivedKits("test.json", records);

      const file = await fever.receivedKitsFile.findOne({
        where: {
          file: "test.json",
        },
      });

      const receivedKits = await fever.receivedKit.findAll({
        where: {
          fileId: file.id,
        },
      });

      expect(receivedKits).toHaveLength(2);

      expect(receivedKits).toContainEqual(
        expect.objectContaining({
          boxBarcode: record1.boxBarcode,
          dateReceived: record1.dateReceived,
        })
      );

      expect(receivedKits).toContainEqual(
        expect.objectContaining({
          boxBarcode: record2.boxBarcode,
          dateReceived: record2.dateReceived,
        })
      );
    });

    it("should update existing records", async () => {
      const db = surveyNonPIIInDb("dvorak");
      const survey = await fever.surveyNonPii.create(db);

      const dao = new ReceivedKitsData(sql);

      const insertRecord = {
        dateReceived: "2019-01-02",
        boxBarcode: "12345678",
        utmBarcode: "aaaaaaaa",
        rdtBarcode: "bbbbbbbb",
        stripBarcode: "cccccccc",
      };

      const insertRecords = new Map([[+survey.id, insertRecord]]);
      await dao.importReceivedKits("test1.json", insertRecords);

      const updateRecord = {
        dateReceived: "2019-01-02",
        boxBarcode: "12345678",
        utmBarcode: "aaaaaaaa",
        rdtBarcode: "bbbbbbbb",
        stripBarcode: "cccccccc",
        recordId: 88,
      };

      const updateRecords = new Map([[+survey.id, updateRecord]]);
      await dao.importReceivedKits("test2.json", updateRecords);

      const kit = await fever.receivedKit.findOne({
        where: {
          surveyId: survey.id,
        },
      });

      expect(kit.recordId).toBe(88);
    });

    it("should passthrough the linked value if the record is not remapped", async () => {
      const db = surveyNonPIIInDb("dvorak");
      const survey = await fever.surveyNonPii.create(db);

      const dao = new ReceivedKitsData(sql);

      const insertRecord = {
        dateReceived: "2019-01-02",
        boxBarcode: "12345678",
        utmBarcode: "aaaaaaaa",
        rdtBarcode: "bbbbbbbb",
        stripBarcode: "cccccccc",
      };

      const insertRecords = new Map([[+survey.id, insertRecord]]);
      await dao.importReceivedKits("test1.json", insertRecords);

      await fever.receivedKit.update(
        {
          linked: true,
        },
        {
          where: {
            boxBarcode: insertRecord.boxBarcode,
          },
        }
      );

      const updateRecord = {
        dateReceived: "2019-01-02",
        boxBarcode: "12345678",
        utmBarcode: "aaaaaaaa",
        rdtBarcode: "bbbbbbbb",
        stripBarcode: "cccccccc",
        recordId: 88,
      };

      const updateRecords = new Map([[+survey.id, updateRecord]]);
      await dao.importReceivedKits("test2.json", updateRecords);

      const kit = await fever.receivedKit.findOne({
        where: {
          surveyId: survey.id,
        },
      });

      expect(kit.linked).toBe(true);
    });

    it("should set linked to false when a record is remapped", async () => {
      const db = surveyNonPIIInDb("dvorak");
      const survey = await fever.surveyNonPii.create(db);

      const dao = new ReceivedKitsData(sql);

      const insertRecord = {
        dateReceived: "2019-01-02",
        boxBarcode: "12345678",
        utmBarcode: "aaaaaaaa",
        rdtBarcode: "bbbbbbbb",
        stripBarcode: "cccccccc",
      };

      const insertRecords = new Map([[+survey.id, insertRecord]]);
      await dao.importReceivedKits("test1.json", insertRecords);

      await fever.receivedKit.update(
        {
          linked: true,
        },
        {
          where: {
            boxBarcode: insertRecord.boxBarcode,
          },
        }
      );

      const updateRecord = {
        dateReceived: "2019-01-02",
        boxBarcode: "12345678",
        utmBarcode: "aaaaaaaa",
        rdtBarcode: "bbbbbbbb",
        stripBarcode: "cccccccc",
        recordId: 88,
        remapped: true,
      };

      const updateRecords = new Map([[+survey.id, updateRecord]]);
      await dao.importReceivedKits("test2.json", updateRecords);

      const kit = await fever.receivedKit.findOne({
        where: {
          surveyId: survey.id,
        },
      });

      expect(kit.linked).toBe(false);
    });
  });
});
