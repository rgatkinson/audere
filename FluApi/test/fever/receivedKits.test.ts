// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { anything, instance, mock, when, capture, anyNumber, anyString, deepEqual } from "ts-mockito";
import { ReceivedKits } from "../../src/services/fever/receivedKits";
import { ReceivedKitsData } from "../../src/services/fever/receivedKitsData";
import { REDCapRetriever } from "../../src/external/redCapRetriever";
import { S3Uploader } from "../../src/external/s3Uploader";
import parse from "csv-parse/lib/sync";

describe("importing received kits", () => {
  it("saves received kits in the database", async () => {
    const record = {
      dateReceived: "2018-01-01",
      boxBarcode: "12345678",
      utmBarcode: "22334455",
      rdtBarcode: "abcdefgh",
      stripBarcode: "aabbccdd"
    };

    const retriever = mock(REDCapRetriever);
    when(retriever.getAtHomeData()).thenResolve([record]);

    const dao = mock(ReceivedKitsData);
    const match = { id: 115, code: "12345678" };
    when(dao.matchBarcodes(deepEqual([record.boxBarcode]))).thenResolve([match]);
    when(dao.importReceivedKits(anyNumber(), anything())).thenResolve();

    const uploader = mock(S3Uploader);
    when(uploader.writeAtHomeData(anyString(), anyString())).thenResolve("1");

    const service = new ReceivedKits(
      instance(dao),
      instance(retriever),
      instance(uploader)
    );
    await service.importReceivedKits();

    const [file, kits] = capture(dao.importReceivedKits).first();
    expect(file).toBe("1");
    expect(kits.get(115).dateReceived).toBe(record.dateReceived);
    expect(kits.get(115).boxBarcode).toBe(record.boxBarcode);    
  });

  it("filters and reports invalid barcodes", async () => {
    const records = [
      {
        dateReceived: "2018-01-01",
        boxBarcode: undefined,
        utmBarcode: "22334455",
        rdtBarcode: "abcdefgh",
        stripBarcode: "aabbccdd"
      },
      {
        dateReceived: "2018-01-01",
        boxBarcode: "/alwkj",
        utmBarcode: "22334455",
        rdtBarcode: "abcdefgh",
        stripBarcode: "aabbccdd"
      }
    ];

    const retriever = mock(REDCapRetriever);
    when(retriever.getAtHomeData()).thenResolve(records);

    const dao = mock(ReceivedKitsData);
    when(dao.importReceivedKits(anyNumber(), anything())).thenResolve();

    const uploader = mock(S3Uploader);
    when(uploader.writeAtHomeData(anyString(), anyString())).thenResolve("1");
    when(uploader.writeBarcodeErrors(anyString(), anyString())).thenResolve();

    const service = new ReceivedKits(
      instance(dao),
      instance(retriever),
      instance(uploader)
    );
    await service.importReceivedKits();

    const [errorFile, contents] = capture(uploader.writeBarcodeErrors).first();
    const csv = parse(contents).slice(1);
    for (let i = 0; i < records.length; i++) {
      expect(csv[i][0]).toBe(records[i].dateReceived);
      expect(csv[i][1]).toBe(records[i].boxBarcode || "");
      expect(csv[i][2]).toBe(records[i].utmBarcode);
      expect(csv[i][3]).toBe(records[i].rdtBarcode);
      expect(csv[i][4]).toBe(records[i].stripBarcode);
      expect(csv[i][5]).toBe("InvalidBarcode");
    }

    const [sourceFile, kits] = capture(dao.importReceivedKits).first();
    expect(sourceFile).toBe("1");
    expect(kits.size).toBe(0);
  });

  it("filters and reports barcodes that don't match any survey", async () => {
    const records = [
      {
        dateReceived: "2018-01-01",
        boxBarcode: "12345678",
        utmBarcode: "22334455",
        rdtBarcode: "abcdefgh",
        stripBarcode: "aabbccdd"
      },
      {
        dateReceived: "2018-01-01",
        boxBarcode: "98765432",
        utmBarcode: "22334455",
        rdtBarcode: "abcdefgh",
        stripBarcode: "aabbccdd"
      }
    ];

    const retriever = mock(REDCapRetriever);
    when(retriever.getAtHomeData()).thenResolve(records);

    const dao = mock(ReceivedKitsData);
    when(dao.matchBarcodes(deepEqual(["12345678", "98765432"]))).thenResolve();
    when(dao.importReceivedKits(anyNumber(), anything())).thenResolve();

    const uploader = mock(S3Uploader);
    when(uploader.writeAtHomeData(anyString(), anyString())).thenResolve("1");
    when(uploader.writeBarcodeErrors(anyString(), anyString())).thenResolve();

    const service = new ReceivedKits(
      instance(dao),
      instance(retriever),
      instance(uploader)
    );
    await service.importReceivedKits();

    const [errorFile, contents] = capture(uploader.writeBarcodeErrors).first();
    const csv = parse(contents).slice(1);
    for (let i = 0; i < records.length; i++) {
      expect(csv[i][0]).toBe(records[i].dateReceived);
      expect(csv[i][1]).toBe(records[i].boxBarcode || "");
      expect(csv[i][2]).toBe(records[i].utmBarcode);
      expect(csv[i][3]).toBe(records[i].rdtBarcode);
      expect(csv[i][4]).toBe(records[i].stripBarcode);
      expect(csv[i][5]).toBe("NoMatch");
    }

    const [sourceFile, kits] = capture(dao.importReceivedKits).first();
    expect(sourceFile).toBe("1");
    expect(kits.size).toBe(0);
  });

  it("filters out barcodes that are already tracked", async () => {
    const records = [
      {
        dateReceived: "2018-01-01",
        boxBarcode: "12345678",
        utmBarcode: "22334455",
        rdtBarcode: "abcdefgh",
        stripBarcode: "aabbccdd"
      },
      {
        dateReceived: "2018-01-01",
        boxBarcode: "98765432",
        utmBarcode: "22334455",
        rdtBarcode: "abcdefgh",
        stripBarcode: "aabbccdd"
      }
    ];

    const retriever = mock(REDCapRetriever);
    when(retriever.getAtHomeData()).thenResolve(records);

    const dao = mock(ReceivedKitsData);
    const matches = [
      { id: 123, code: "12345678", kitId: 1 },
      { id: 456, code: "98765432", kitId: 2 }
    ];
    when(dao.matchBarcodes(deepEqual(["12345678", "98765432"]))).thenResolve(matches);
    when(dao.importReceivedKits(anyNumber(), anything())).thenResolve();

    const uploader = mock(S3Uploader);
    when(uploader.writeAtHomeData(anyString(), anyString())).thenResolve("1");

    const service = new ReceivedKits(
      instance(dao),
      instance(retriever),
      instance(uploader)
    );
    await service.importReceivedKits();

    const [file, kits] = capture(dao.importReceivedKits).first();
    expect(file).toMatch("1");
    expect(kits.size).toBe(0);
  });
});
