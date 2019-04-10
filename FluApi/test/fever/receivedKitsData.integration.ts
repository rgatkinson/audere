// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { createSplitSql, SplitSql } from "../../src/util/sql";
import { FeverModels, defineFeverModels } from "../../src/models/db/fever";
import { ReceivedKitsData } from "../../src/services/fever/receivedKitsData";
import { surveyNonPIIInDb } from "../endpoints/feverSampleData";

describe("received kits data access", () => {
  let sql: SplitSql;
  let fever: FeverModels;

  beforeAll(async done => {
    sql = createSplitSql();
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
  }

  it("should filter existing barcodes", async () => {
    const barcode = "12345678";
    const db = surveyNonPIIInDb("asdf");
    db.survey.samples.push({ sample_type: "scan", code: barcode });
    const survey = await fever.surveyNonPii.create(db, { returning: true });

    const file = await fever.receivedKitsFile.create(
      { file: "test.json" },
      { returning: true}
    );

    const kit = await fever.receivedKit.create({
      surveyId: +survey.id,
      fileId: file.id,
      boxBarcode: barcode,
      dateReceived: "2018-09-19"
    }, {
      returning: true
    });

    const dao = new ReceivedKitsData(sql);
    const matches = await dao.matchBarcodes([barcode]);

    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe(+survey.id);
    expect(matches[0].kitId).toBe(kit.id);
  });

  it("should match barcodes to sample code", async () => {
    const barcode = "a1b2c3d4";
    const db = surveyNonPIIInDb("asdf");
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
    const db = surveyNonPIIInDb("asdf");
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

  it("should write file and kit data", async () => {
    const db = [
      surveyNonPIIInDb("asdf"),
      surveyNonPIIInDb("qwerty")
    ];

    const surveys = await fever.surveyNonPii.bulkCreate(db, {
      returning: true
    });

    const record1 = {
      dateReceived: "2019-01-02",
      boxBarcode: "12345678",
      utmBarcode: "aaaaaaaa",
      rdtBarcode: "bbbbbbbb",
      stripBarcode: "cccccccc"
    }

    const record2 = {
      dateReceived: "2017-03-12",
      boxBarcode: "abcdefgh",
      utmBarcode: "11111111",
      rdtBarcode: "22222222",
      stripBarcode: "33333333"
    }

    const records = new Map([
      [+surveys[0].id, record1],
      [+surveys[1].id, record2]
    ]);

    const dao = new ReceivedKitsData(sql);
    await dao.importReceivedKits("test.json", records);

    const file = await fever.receivedKitsFile.findOne({
      where: {
        file: "test.json"
      }
    });

    const receivedKits = await fever.receivedKit.findAll({
      where: {
        fileId: file.id
      }
    });

    expect(receivedKits).toHaveLength(2);

    expect(receivedKits).toContainEqual(
      expect.objectContaining({
        boxBarcode: record1.boxBarcode,
        dateReceived: record1.dateReceived
      })
    );

    expect(receivedKits).toContainEqual(
      expect.objectContaining({
        boxBarcode: record2.boxBarcode,
        dateReceived: record2.dateReceived
      })
    );
  });

  it("should enforce the unique constraint on barcode", async () => {
    const db = [
      surveyNonPIIInDb("asdf"),
      surveyNonPIIInDb("qwerty")
    ];

    const surveys = await fever.surveyNonPii.bulkCreate(db, {
      returning: true
    });

    const record1 = {
      dateReceived: "2019-01-02",
      boxBarcode: "12345678",
      utmBarcode: "aaaaaaaa",
      rdtBarcode: "bbbbbbbb",
      stripBarcode: "cccccccc"
    }

    const record2 = {
      dateReceived: "2017-03-12",
      boxBarcode: "abcdefgh",
      utmBarcode: "11111111",
      rdtBarcode: "22222222",
      stripBarcode: "33333333"
    }

    const records = new Map([
      [+surveys[0].id, record1],
      [+surveys[1].id, record2]
    ]);

    const dao = new ReceivedKitsData(sql);
    await dao.importReceivedKits("test.json", records);
    const result = dao.importReceivedKits("notest.json", records);

    expect(result).rejects.toThrow();

    const file = await fever.receivedKitsFile.findOne({
      where: {
        file: "notest.json"
      }
    });

    expect(file).toBeNull();
  });
});
