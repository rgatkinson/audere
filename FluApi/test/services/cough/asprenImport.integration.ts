// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import asprenReports from "../../resources/asprenExamples.json";
import { AsprenClient } from "../../../src/external/asprenClient";
import { AsprenImport } from "../../../src/services/cough/asprenImport";
import { createSplitSql, SplitSql } from "../../../src/util/sql";
import { CoughModels, defineCoughModels } from "../../../src/models/db/cough";
import { getExcelS3Client } from "../../util/mockS3Client";

describe("import ASPREN reports", () => {
  let sql: SplitSql;
  let cough: CoughModels;

  async function cleanDb() {
    await Promise.all([
      cough.asprenData.destroy({ where: {} }),
      cough.asprenFile.destroy({ where: {} }),
    ]);
  }

  afterAll(async done => {
    await cleanDb();
    done();
  });

  beforeAll(async done => {
    sql = createSplitSql();
    cough = defineCoughModels(sql);
    done();
  });

  beforeEach(async done => {
    await cleanDb();
    done();
  });

  it("should write ASPREN data on import", async () => {
    const s3Config = {
      fluReportsBucket: "string",
      asprenReportsBucket: "string",
      coughFollowUpBucket: "string",
      fileshareBucket: "string",
      virenaRecordsBucket: "string",
      evidationBucket: "string",
    };
    const list = [
      {
        Key: "abc",
        LastModified: new Date(),
        ETag: "def",
      },
    ];

    const s3 = getExcelS3Client(list, asprenReports.default);
    const asprenClient = new AsprenClient(s3, s3Config);
    const svc = new AsprenImport(sql, asprenClient);

    await svc.importAsprenReports();

    const file = await cough.asprenFile.findOne({
      where: {
        key: list[0].Key,
        hash: list[0].ETag,
      },
    });
    const rows = await cough.asprenData.findAll({});

    expect(file).not.toBeUndefined();
    expect(rows).toHaveLength(asprenReports.default.split("\n").length - 1);
  });

  it("should skip files that have already been processed", async () => {
    const s3Config = {
      fluReportsBucket: "string",
      asprenReportsBucket: "string",
      coughFollowUpBucket: "string",
      fileshareBucket: "string",
      virenaRecordsBucket: "string",
      evidationBucket: "string",
    };
    const list = [
      {
        Key: "abc",
        LastModified: new Date(),
        ETag: "def",
      },
    ];

    const s3 = getExcelS3Client(list, asprenReports.default);
    const asprenClient = new AsprenClient(s3, s3Config);
    const svc = new AsprenImport(sql, asprenClient);

    await cough.asprenFile.create({
      key: list[0].Key,
      hash: list[0].ETag,
    });

    await svc.importAsprenReports();

    const rows = await cough.asprenData.findAll({});
    expect(rows).toHaveLength(0);
  });

  it("should overwrite existing data", async () => {
    const s3Config = {
      fluReportsBucket: "string",
      asprenReportsBucket: "string",
      coughFollowUpBucket: "string",
      fileshareBucket: "string",
      virenaRecordsBucket: "string",
      evidationBucket: "string",
    };
    const list = [
      {
        Key: "abc",
        LastModified: new Date(),
        ETag: "def",
      },
    ];

    const s3 = getExcelS3Client(list, asprenReports.default);
    const asprenClient = new AsprenClient(s3, s3Config);
    const svc = new AsprenImport(sql, asprenClient);

    await cough.asprenData.bulkCreate([
      {
        barcode: "extra_record",
        encounterDate: "123",
        encounterState: "123",
        adenoResult: false,
        pertussisResult: false,
        fluAResult: false,
        fluBResult: false,
        h1n1Result: false,
        h3n2Result: false,
        metapneumovirusResult: false,
        mycopneumoniaResult: false,
        para1Result: false,
        para2Result: false,
        para3Result: false,
        rhinovirusResult: false,
        rsvResult: false,
        victoriaResult: false,
        yamagataResult: false,
        aboriginalOrIslander: undefined,
        dateOnset: "123",
        currentVaccination: undefined,
        vaccinationDate: undefined,
        previousVaccination: undefined,
        comorbities: undefined,
        comorbitiesDescription: undefined,
        healthcareWorkerStatus: undefined,
        overseasIllness: undefined,
        overseasLocation: undefined,
      },
      {
        barcode: "12345679",
        encounterDate: "123",
        encounterState: "123",
        adenoResult: false,
        pertussisResult: false,
        fluAResult: false,
        fluBResult: false,
        h1n1Result: false,
        h3n2Result: false,
        metapneumovirusResult: false,
        mycopneumoniaResult: false,
        para1Result: false,
        para2Result: false,
        para3Result: false,
        rhinovirusResult: false,
        rsvResult: false,
        victoriaResult: false,
        yamagataResult: false,
        aboriginalOrIslander: undefined,
        dateOnset: "123",
        currentVaccination: undefined,
        vaccinationDate: undefined,
        previousVaccination: undefined,
        comorbities: undefined,
        comorbitiesDescription: undefined,
        healthcareWorkerStatus: undefined,
        overseasIllness: undefined,
        overseasLocation: undefined,
      },
    ]);

    await svc.importAsprenReports();

    const rows = await cough.asprenData.findAll({});
    expect(rows).toHaveLength(asprenReports.default.split("\n").length - 1);
    // deleted
    expect(rows.find(r => r.barcode === "extra_record")).toBeUndefined();
    // updated
    expect(rows.find(r => r.barcode === "12345678").encounterDate).toBe(
      "1/4/19"
    );
  });
});
