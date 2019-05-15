// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  anything,
  instance,
  mock,
  when,
  capture,
  anyNumber,
  anyString,
  deepEqual,
  verify
} from "ts-mockito";
import { ReceivedKits } from "../../src/services/fever/receivedKits";
import { ReceivedKitsData } from "../../src/services/fever/receivedKitsData";
import { REDCapClient } from "../../src/external/redCapClient";
import { S3Uploader } from "../../src/external/s3Uploader";
import parse from "csv-parse/lib/sync";

describe("exporting barcodes to REDCap", () => {
  it("should link provisioned barcodes in the database", async () => {
    const unlinked = {
      id: 123,
      code: "secret",
      scannedAt: "2019-04-14",
      state: "WA",
      recordId: 1
    };

    const dao = mock(ReceivedKitsData);
    when(dao.findUnlinkedBarcodes()).thenResolve([unlinked]);
    when(dao.linkKits(anything())).thenResolve();

    const mapping = { recordId: 1, surveyId: 1 };
    const mappedKits = new Map([[unlinked.code, mapping]]);
    const redcap = mock(REDCapClient);
    when(redcap.provisionBarcodes(deepEqual([unlinked]))).thenResolve(
      mappedKits
    );

    const service = new ReceivedKits(
      instance(dao),
      instance(redcap),
      undefined
    );

    await service.exportBarcodes();

    verify(redcap.provisionBarcodes(deepEqual([unlinked]))).once();
    verify(dao.linkKits(anything())).once();
  });
});

describe("importing received kits", () => {
  it("saves received kits in the database", async () => {
    const record = {
      dateReceived: "2018-01-01",
      boxBarcode: "12345678",
      utmBarcode: "22334455",
      rdtBarcode: "abcdefgh",
      stripBarcode: "aabbccdd",
      recordId: 1
    };

    const redcap = mock(REDCapClient);
    when(redcap.getAtHomeData()).thenResolve([record]);

    const dao = mock(ReceivedKitsData);
    const match = { id: 115, code: "12345678" };
    when(dao.matchBarcodes(deepEqual([record.boxBarcode]))).thenResolve([
      match
    ]);
    when(dao.importReceivedKits(anyNumber(), anything())).thenResolve();

    const uploader = mock(S3Uploader);
    when(uploader.writeAtHomeData(anyString(), anyString())).thenResolve("1");

    const service = new ReceivedKits(
      instance(dao),
      instance(redcap),
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
        stripBarcode: "aabbccdd",
        recordId: 1
      },
      {
        dateReceived: "2018-01-01",
        boxBarcode: "/alwkj",
        utmBarcode: "22334455",
        rdtBarcode: "abcdefgh",
        stripBarcode: "aabbccdd",
        recordId: 2
      }
    ];

    const redcap = mock(REDCapClient);
    when(redcap.getAtHomeData()).thenResolve(records);

    const dao = mock(ReceivedKitsData);
    when(dao.importReceivedKits(anyNumber(), anything())).thenResolve();

    const uploader = mock(S3Uploader);
    when(uploader.writeAtHomeData(anyString(), anyString())).thenResolve("1");
    when(uploader.writeBarcodeErrors(anyString(), anyString())).thenResolve();

    const service = new ReceivedKits(
      instance(dao),
      instance(redcap),
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
        stripBarcode: "aabbccdd",
        recordId: 1
      },
      {
        dateReceived: "2018-01-01",
        boxBarcode: "98765432",
        utmBarcode: "22334455",
        rdtBarcode: "abcdefgh",
        stripBarcode: "aabbccdd",
        recordId: 2
      }
    ];

    const redcap = mock(REDCapClient);
    when(redcap.getAtHomeData()).thenResolve(records);

    const dao = mock(ReceivedKitsData);
    when(dao.matchBarcodes(deepEqual(["12345678", "98765432"]))).thenResolve();
    when(dao.importReceivedKits(anyNumber(), anything())).thenResolve();

    const uploader = mock(S3Uploader);
    when(uploader.writeAtHomeData(anyString(), anyString())).thenResolve("1");
    when(uploader.writeBarcodeErrors(anyString(), anyString())).thenResolve();

    const service = new ReceivedKits(
      instance(dao),
      instance(redcap),
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
        stripBarcode: "aabbccdd",
        recordId: 1
      },
      {
        dateReceived: "2018-01-01",
        boxBarcode: "98765432",
        utmBarcode: "22334455",
        rdtBarcode: "abcdefgh",
        stripBarcode: "aabbccdd",
        recordId: 2
      }
    ];

    const redcap = mock(REDCapClient);
    when(redcap.getAtHomeData()).thenResolve(records);

    const dao = mock(ReceivedKitsData);
    const matches = [
      { id: 123, code: "12345678", kitId: 1, recordId: 1, fileId: 1 },
      { id: 456, code: "98765432", kitId: 2, recordId: 2, fileId: 2 }
    ];
    when(dao.matchBarcodes(deepEqual(["12345678", "98765432"]))).thenResolve(
      matches
    );
    when(dao.importReceivedKits(anyNumber(), anything())).thenResolve();

    const uploader = mock(S3Uploader);
    when(uploader.writeAtHomeData(anyString(), anyString())).thenResolve("1");

    const service = new ReceivedKits(
      instance(dao),
      instance(redcap),
      instance(uploader)
    );
    await service.importReceivedKits();

    const [file, kits] = capture(dao.importReceivedKits).first();
    expect(file).toMatch("1");
    expect(kits.size).toBe(0);
  });

  it("matches the greater record by row index if there are duplicates", async () => {
    const records = [
      {
        dateReceived: "2018-01-01",
        boxBarcode: "12345678",
        utmBarcode: "22334455",
        rdtBarcode: "abcdefgh",
        stripBarcode: "aabbccdd",
        recordId: 1
      },
      {
        dateReceived: "2018-01-02",
        boxBarcode: "12345678",
        utmBarcode: "22334455",
        rdtBarcode: "abcdefgh",
        stripBarcode: "aabbccdd",
        recordId: 2
      }
    ];

    const redcap = mock(REDCapClient);
    when(redcap.getAtHomeData()).thenResolve(records);

    const dao = mock(ReceivedKitsData);
    const matches = [{ id: 123, code: "12345678", kitId: 1 }];
    when(dao.matchBarcodes(deepEqual(["12345678"]))).thenResolve(matches);
    when(dao.importReceivedKits(anyNumber(), anything())).thenResolve();

    const uploader = mock(S3Uploader);
    when(uploader.writeAtHomeData(anyString(), anyString())).thenResolve("1");

    const service = new ReceivedKits(
      instance(dao),
      instance(redcap),
      instance(uploader)
    );
    await service.importReceivedKits();

    const [file, kits] = capture(dao.importReceivedKits).first();
    expect(file).toMatch("1");
    expect(kits.size).toBe(1);
    expect(kits.has(123)).toBe(true);
    expect(kits.get(123).recordId).toBe(2);
  });

  it("discards duplicate barcodes after one has been set", async () => {
    // Duplicate in REDCap
    const records = [
      {
        dateReceived: "2018-01-01",
        boxBarcode: "12345678",
        utmBarcode: "22334455",
        rdtBarcode: "abcdefgh",
        stripBarcode: "aabbccdd",
        recordId: 1
      },
      {
        dateReceived: "2018-01-02",
        boxBarcode: "12345678",
        utmBarcode: "22334455",
        rdtBarcode: "abcdefgh",
        stripBarcode: "aabbccdd",
        recordId: 1
      }
    ];

    const redcap = mock(REDCapClient);
    when(redcap.getAtHomeData()).thenResolve(records);

    const dao = mock(ReceivedKitsData);

    // Duplicate in Audere
    const matches = [
      { id: 123, code: "12345678", kitId: 1, recordId: 1, fileId: 1 },
      { id: 124, code: "12345678" }
    ];

    when(dao.matchBarcodes(deepEqual(["12345678"]))).thenResolve(matches);
    when(dao.importReceivedKits(anyNumber(), anything())).thenResolve();

    const uploader = mock(S3Uploader);
    when(uploader.writeAtHomeData(anyString(), anyString())).thenResolve("1");

    const service = new ReceivedKits(
      instance(dao),
      instance(redcap),
      instance(uploader)
    );
    await service.importReceivedKits();

    const [file, kits] = capture(dao.importReceivedKits).first();
    expect(file).toMatch("1");
    expect(kits.size).toBe(0);
  });

  it("remaps REDCap records when a different record is used for a given barcode", async () => {
    const records = [
      {
        dateReceived: "2018-01-01",
        boxBarcode: "12345678",
        utmBarcode: "22334455",
        rdtBarcode: "abcdefgh",
        stripBarcode: "aabbccdd",
        fileId: 1,
        recordId: 1
      }
    ];

    const redcap = mock(REDCapClient);
    when(redcap.getAtHomeData()).thenResolve(records);

    const dao = mock(ReceivedKitsData);

    // Different record id
    const matches = [
      { id: 123, code: "12345678", kitId: 1, recordId: 555 }
    ];
    when(dao.matchBarcodes(deepEqual(["12345678"]))).thenResolve(matches);
    when(dao.importReceivedKits(anyNumber(), anything())).thenResolve();

    const uploader = mock(S3Uploader);
    when(uploader.writeAtHomeData(anyString(), anyString())).thenResolve("1");

    const service = new ReceivedKits(
      instance(dao),
      instance(redcap),
      instance(uploader)
    );
    await service.importReceivedKits();

    const [file, kits] = capture(dao.importReceivedKits).first();
    expect(file).toMatch("1");
    expect(kits.size).toBe(1);
    const record = kits.get(123);
    expect(record.remapped).toBe(true);
  });

  it("prefers matched records once they have been set", async () => {
    const records = [
      {
        dateReceived: "2018-01-01",
        boxBarcode: "12345678",
        utmBarcode: "22334455",
        rdtBarcode: "abcdefgh",
        stripBarcode: "aabbccdd",
        fileId: 1,
        recordId: 1
      }
    ];

    const redcap = mock(REDCapClient);
    when(redcap.getAtHomeData()).thenResolve(records);

    const dao = mock(ReceivedKitsData);

    // Different record id
    const matches = [
      { id: 123, code: "12345678", kitId: 1, recordId: 555 },
      { id: 124, code: "12345678" }
    ];
    when(dao.matchBarcodes(deepEqual(["12345678"]))).thenResolve(matches);
    when(dao.importReceivedKits(anyNumber(), anything())).thenResolve();

    const uploader = mock(S3Uploader);
    when(uploader.writeAtHomeData(anyString(), anyString())).thenResolve("1");

    const service = new ReceivedKits(
      instance(dao),
      instance(redcap),
      instance(uploader)
    );
    await service.importReceivedKits();

    const [file, kits] = capture(dao.importReceivedKits).first();
    expect(file).toMatch("1");
    expect(kits.size).toBe(1);
    expect(kits.has(123)).toBe(true);
  });
});
