// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import virenaData from "../../resources/virenaExamples.json";
import { createSplitSql, SplitSql } from "../../../src/util/sql";
import {
  ChillsModels,
  defineChillsModels,
} from "../../../src/models/db/chills";
import { getExcelS3Client } from "../../util/mockS3Client";
import { ChillsVirenaService } from "../../../src/services/chills/chillsVirenaService";
import { VirenaClient } from "../../../src/external/virenaClient";

describe("import Virena data", () => {
  const progress = () => {};
  let sql: SplitSql;
  let chills: ChillsModels;

  async function cleanDb() {
    await Promise.all([chills.virenaFile.destroy({ where: {} })]);
  }

  afterAll(async done => {
    await cleanDb();
    done();
  });

  beforeAll(async done => {
    sql = createSplitSql();
    chills = defineChillsModels(sql);
    done();
  });

  beforeEach(async done => {
    await cleanDb();
    done();
  });

  const config = {
    fluReportsBucket: "string",
    asprenReportsBucket: "string",
    coughFollowUpBucket: "string",
    fileshareBucket: "string",
    virenaRecordsBucket: "string",
    evidationBucket: "string",
  };

  function getDefaultClient() {
    const list = [
      {
        Key: "abc.xlsb",
        LastModified: new Date(),
        ETag: "def",
      },
    ];
    return getExcelS3Client(list, virenaData.default);
  }

  it("should write new files to the database in segments", async () => {
    const s3 = getDefaultClient();
    const client = new VirenaClient(s3, config);
    const svc = new ChillsVirenaService(sql, client, 1);

    await svc.import(progress);

    const file = await chills.virenaFile.findOne({
      where: {
        key: "abc.xlsb",
      },
    });

    expect(file).not.toBeNull();
    expect(file.loaded).toBe(true);
    expect(file.nextRow).toBe(5);

    const records = await chills.virenaRecord.findAll({
      where: {
        fileId: file.id,
      },
    });

    expect(records).toHaveLength(5);
  });

  it("should overwrite files that have changed", async () => {
    const existingFile = await chills.virenaFile.create({
      key: "abc.xlsb",
      hash: "abc",
      loaded: true,
      nextRow: 5,
    });

    await chills.virenaRecord.create({
      fileId: existingFile.id,
      serialNumber: "101",
      testDate: "1/1/2018",
      facility: "222",
      city: "Seattle",
      state: "WA",
      zip: "98101",
      patientAge: "50",
      result1: true,
      result2: false,
      overallResult: true,
      county: "King County",
      facilityDescription: "Physician Office",
    });

    const s3 = getDefaultClient();

    const client = new VirenaClient(s3, config);
    const svc = new ChillsVirenaService(sql, client, 1);

    await svc.import(progress);

    const file = await chills.virenaFile.findOne({
      where: {
        key: "abc.xlsb",
      },
    });

    expect(file).not.toBeNull();
    expect(file.hash).toBe("def");
    expect(file.loaded).toBe(true);
    expect(file.nextRow).toBe(5);

    const records = await chills.virenaRecord.findAll({
      where: {
        fileId: file.id,
      },
    });

    expect(records).toHaveLength(5);
    expect(records.find(r => r.serialNumber === "101")).toBeUndefined();
  });

  it("should finish loading incomplete files", async () => {
    await chills.virenaFile.create({
      key: "abc.xlsb",
      hash: "def",
      loaded: false,
      nextRow: 3,
    });

    const s3 = getDefaultClient();

    const client = new VirenaClient(s3, config);
    const svc = new ChillsVirenaService(sql, client, 1);

    await svc.import(progress);

    const file = await chills.virenaFile.findOne({
      where: {
        key: "abc.xlsb",
      },
    });

    expect(file).not.toBeNull();
    expect(file.hash).toBe("def");
    expect(file.loaded).toBe(true);
    expect(file.nextRow).toBe(5);

    const records = await chills.virenaRecord.findAll({
      where: {
        fileId: file.id,
      },
    });

    expect(records).toHaveLength(2);
    expect(records.every(r => r.serialNumber === "557")).toBe(true);
  });
});
