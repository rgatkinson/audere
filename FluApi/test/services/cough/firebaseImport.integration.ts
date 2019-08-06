// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { instance, mock, when, anyString, verify } from "ts-mockito";
import { CoughModels, defineCoughModels } from "../../../src/models/db/cough";
import { BigQueryTableImporter } from "../../../src/external/bigQuery";
import { DataPipelineService } from "../../../src/services/dataPipelineService";
import { FirebaseImport } from "../../../src/services/cough/firebaseImport";
import { SplitSql, createSplitSql } from "../../../src/util/sql";
import moment = require("moment");

describe("Firebase import", () => {
  let sql: SplitSql;
  let cough: CoughModels;

  async function cleanDb() {
    await Promise.all([
      cough.firebaseAnalytics.destroy({ where: {} }),
      cough.firebaseAnalyticsTable.destroy({ where: {} }),
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

  describe("find Firebase tables to import", () => {
    it("should return new tables within the lookback window", async () => {
      const now = moment().utc();
      const valid = now.subtract(1, "days").format("YYYYMMDD");
      const invalid1 = now.subtract(1000, "days").format("YYYYMMDD");
      const invalid2 = now.add(2000, "days").format("YYYYMMDD");

      const bigQuery = mock(BigQueryTableImporter);
      when(bigQuery.listTables()).thenResolve([valid, invalid1, invalid2]);
      when(bigQuery.getTableMetadata(anyString())).thenResolve({
        lastModifiedTime: "5",
      });

      const svc = new FirebaseImport(sql, cough, instance(bigQuery), null);

      const tableList = await svc.findTablesToUpdate();
      expect(tableList.size).toBe(1);
      expect(tableList.has(valid)).toBe(true);
    });

    it("should return tables that have been updated", async () => {
      const now = moment().utc();
      const date1 = now.format("YYYYMMDD");
      const date2 = now.subtract(1, "days").format("YYYYMMDD");

      await cough.firebaseAnalyticsTable.bulkCreate([
        {
          name: date1,
          modified: 4,
        },
        {
          name: date2,
          modified: 6,
        },
      ]);

      const bigQuery = mock(BigQueryTableImporter);
      when(bigQuery.listTables()).thenResolve([date1, date2]);
      when(bigQuery.getTableMetadata(anyString())).thenResolve({
        lastModifiedTime: "5",
      });

      const svc = new FirebaseImport(sql, cough, instance(bigQuery), null);

      const tableList = await svc.findTablesToUpdate();
      expect(tableList.size).toBe(1);
      expect(tableList.has(date1)).toBe(true);
    });
  });

  describe("import Firebase analytics", () => {
    it("should insert event data, track table modified time, and refresh cough_derived", async () => {
      const bigQuery = mock(BigQueryTableImporter);
      when(bigQuery.getTableRows(anyString(), undefined)).thenResolve({
        results: [{ data: "data" }],
        token: null,
      });

      const pipeline = mock(DataPipelineService);
      when(pipeline.refresh()).thenResolve();

      const svc = new FirebaseImport(
        sql,
        cough,
        instance(bigQuery),
        instance(pipeline)
      );
      await svc.importAnalytics(new Map([["events_20190716", 1]]));

      const rows = await cough.firebaseAnalytics.findAll({});
      expect(rows).toHaveLength(1);
      expect(rows[0].event_date).toBe("20190716");
      expect(rows[0].event["data"]).toBe("data");

      const tables = await cough.firebaseAnalyticsTable.findAll({});
      expect(tables).toHaveLength(1);
      expect(tables[0].name).toBe("events_20190716");
      expect(tables[0].modified).toBe("1");

      verify(pipeline.refresh()).called();
    });

    it("should overwrite existing event data for a given date", async () => {
      await cough.firebaseAnalytics.create({
        event_date: "20190716",
        event: { data: "old_data" },
      });

      const bigQuery = mock(BigQueryTableImporter);
      when(bigQuery.getTableRows(anyString(), undefined)).thenResolve({
        results: [{ data: "new_data" }],
        token: null,
      });

      const pipeline = mock(DataPipelineService);
      when(pipeline.refresh()).thenResolve();

      const svc = new FirebaseImport(
        sql,
        cough,
        instance(bigQuery),
        instance(pipeline)
      );
      await svc.importAnalytics(new Map([["events_20190716", 1]]));

      const rows = await cough.firebaseAnalytics.findAll({});
      expect(rows).toHaveLength(1);
      expect(rows[0].event_date).toBe("20190716");
      expect(rows[0].event["data"]).toBe("new_data");
    });

    it("should retrieve all events across paged API responses", async () => {
      const bigQuery = mock(BigQueryTableImporter);
      when(bigQuery.getTableRows(anyString(), undefined)).thenResolve({
        results: [{ data: "data1" }],
        token: "a",
      });
      when(bigQuery.getTableRows(anyString(), "a")).thenResolve({
        results: [{ data: "data2" }],
        token: "b",
      });
      when(bigQuery.getTableRows(anyString(), "b")).thenResolve({
        results: [{ data: "data3" }],
        token: null,
      });

      const pipeline = mock(DataPipelineService);
      when(pipeline.refresh()).thenResolve();

      const svc = new FirebaseImport(
        sql,
        cough,
        instance(bigQuery),
        instance(pipeline)
      );
      await svc.importAnalytics(new Map([["events_20190716", 1]]));

      const rows = await cough.firebaseAnalytics.findAll({});
      expect(rows).toHaveLength(3);
      expect(rows).toContainEqual(
        expect.objectContaining({
          event: {
            data: "data1",
          },
        })
      );
      expect(rows).toContainEqual(
        expect.objectContaining({
          event: {
            data: "data2",
          },
        })
      );
      expect(rows).toContainEqual(
        expect.objectContaining({
          event: {
            data: "data3",
          },
        })
      );
    });
  });
});
