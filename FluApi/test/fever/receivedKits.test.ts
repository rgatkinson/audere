// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { anything, instance, mock, when, capture, anyNumber, anyString, verify } from "ts-mockito";
import { ReceivedKits } from "../../src/services/fever/receivedKits";
import { ReceivedKitsData } from "../../src/services/fever/receivedKitsData";
import { S3Retriever } from "../../src/external/s3Retriever";
import { S3Uploader } from "../../src/external/s3Uploader";
import parse from "csv-parse/lib/sync";

describe("importing received kits", () => {
  it("saves received kits in the database", async () => {
    const files = ["1"];
    const record = {
      dateReceived: "2018-01-01",
      boxBarcode: "12345678",
      utmBarcode: "22334455",
      rdtBarcode: "abcdefgh",
      stripBarcode: "aabbccdd"
    };

    const retriever = mock(S3Retriever);
    when(retriever.listReceivedKitFiles()).thenResolve(files);
    when(retriever.retrieveReceivedKits(files)).thenResolve(new Map([
      ["1", [record]]
    ]));

    const dao = mock(ReceivedKitsData);
    when(dao.findFilesToProcess(files)).thenResolve(files);
    when(dao.filterExistingBarcodes(anything()))
      .thenResolve([record.boxBarcode]);
    when(dao.findSurveyByBarcode("12345678")).thenResolve(115);
    when(dao.importReceivedKits(anyNumber(), anything())).thenResolve();

    const service = new ReceivedKits(
      instance(dao),
      instance(retriever),
      undefined
    );
    await service.importReceivedKits();

    const [file, kits] = capture(dao.importReceivedKits).first();
    expect(file).toBe("1");
    expect(kits.get(115).dateReceived).toBe(record.dateReceived);
    expect(kits.get(115).boxBarcode).toBe(record.boxBarcode);    
  });

  it("filters and reports invalid barcodes", async () => {
    const files = ["1"];
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

    const retriever = mock(S3Retriever);
    when(retriever.listReceivedKitFiles()).thenResolve(files);
    when(retriever.retrieveReceivedKits(files)).thenResolve(new Map([
      ["1", records]
    ]));

    const dao = mock(ReceivedKitsData);
    when(dao.findFilesToProcess(files)).thenResolve(files);
    when(dao.importReceivedKits(anyNumber(), anything())).thenResolve();

    const uploader = mock(S3Uploader);
    when(uploader.writeBarcodeErrors(anyString())).thenResolve();

    const service = new ReceivedKits(
      instance(dao),
      instance(retriever),
      instance(uploader)
    );
    await service.importReceivedKits();

    const [contents] = capture(uploader.writeBarcodeErrors).first();
    const csv = parse(contents).slice(1);
    for (let i = 0; i < records.length; i++) {
      expect(csv[i][0]).toBe(records[i].dateReceived);
      expect(csv[i][1]).toBe(records[i].boxBarcode || "");
      expect(csv[i][2]).toBe(records[i].utmBarcode);
      expect(csv[i][3]).toBe(records[i].rdtBarcode);
      expect(csv[i][4]).toBe(records[i].stripBarcode);
      expect(csv[i][5]).toBe("InvalidBarcode");
    }

    const [file, kits] = capture(dao.importReceivedKits).first();
    expect(file).toBe("1");
    expect(kits.size).toBe(0);
  });

  it("filters and reports barcodes that don't match any survey", async () => {
    const files = ["1"];
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

    const retriever = mock(S3Retriever);
    when(retriever.listReceivedKitFiles()).thenResolve(files);
    when(retriever.retrieveReceivedKits(files)).thenResolve(new Map([
      ["1", records]
    ]));

    const dao = mock(ReceivedKitsData);
    when(dao.findFilesToProcess(files)).thenResolve(files);
    when(dao.filterExistingBarcodes(anything()))
      .thenResolve(records.map(r => r.boxBarcode));
    when(dao.findSurveyByBarcode("12345678")).thenResolve(null);
    when(dao.findSurveyByBarcode("98765432")).thenResolve(null);
    when(dao.importReceivedKits(anyNumber(), anything())).thenResolve();

    const uploader = mock(S3Uploader);
    when(uploader.writeBarcodeErrors(anyString())).thenResolve();

    const service = new ReceivedKits(
      instance(dao),
      instance(retriever),
      instance(uploader)
    );
    await service.importReceivedKits();

    const [contents] = capture(uploader.writeBarcodeErrors).first();
    const csv = parse(contents).slice(1);
    for (let i = 0; i < records.length; i++) {
      expect(csv[i][0]).toBe(records[i].dateReceived);
      expect(csv[i][1]).toBe(records[i].boxBarcode || "");
      expect(csv[i][2]).toBe(records[i].utmBarcode);
      expect(csv[i][3]).toBe(records[i].rdtBarcode);
      expect(csv[i][4]).toBe(records[i].stripBarcode);
      expect(csv[i][5]).toBe("NoMatch");
    }

    const [file, kits] = capture(dao.importReceivedKits).first();
    expect(file).toBe("1");
    expect(kits.size).toBe(0);
  });

  it("filters out barcodes that are already tracked", async () => {
    const files = ["1"];
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

    const retriever = mock(S3Retriever);
    when(retriever.listReceivedKitFiles()).thenResolve(files);
    when(retriever.retrieveReceivedKits(files)).thenResolve(new Map([
      ["1", records]
    ]));

    const dao = mock(ReceivedKitsData);
    when(dao.findFilesToProcess(files)).thenResolve(files);
    when(dao.filterExistingBarcodes(anything()))
      .thenResolve([]);
    when(dao.importReceivedKits(anyNumber(), anything())).thenResolve();

    const service = new ReceivedKits(
      instance(dao),
      instance(retriever),
      undefined
    );
    await service.importReceivedKits();

    const [file, kits] = capture(dao.importReceivedKits).first();
    expect(file).toBe("1");
    expect(kits.size).toBe(0);
  });

  it("does not re-process files that are already tracked", async () => {
    const files = ["1"];
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

    const retriever = mock(S3Retriever);
    when(retriever.listReceivedKitFiles()).thenResolve(files);

    const dao = mock(ReceivedKitsData);
    when(dao.findFilesToProcess(files)).thenResolve([]);

    const service = new ReceivedKits(
      instance(dao),
      instance(retriever),
      undefined
    );
    await service.importReceivedKits();

    verify(dao.importReceivedKits(anyNumber(), anything())).never();
  });
});
