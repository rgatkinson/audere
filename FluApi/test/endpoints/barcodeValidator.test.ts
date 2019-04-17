// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import request from "supertest";
import { createSplitSql } from "../../src/util/sql";
import { createPublicApp } from "../../src/app";
import { createTestSessionStore } from "../../src/endpoints/webPortal/endpoint";
import { defineBarcodes } from "../../src/models/db/fever";

const BARCODE = "00abcdef";

describe("validateBarcodes", () => {
  let sql;
  let barcodes;
  let publicApp;

  beforeAll(async done => {
    sql = createSplitSql();
    barcodes = defineBarcodes(sql.nonPii);
    const sessionStore = createTestSessionStore(sql);
    publicApp = await createPublicApp({ sql, sessionStore });
    done();
  });

  afterAll(async done => {
    await sql.close();
    done();
  });

  it("normally returns 404", async () => {
    await cleanup(BARCODE);
    await request(publicApp)
      .get("/api/validateBarcode/" + BARCODE)
      .send()
      .expect(404);
  });

  it("returns valid", async () => {
    await cleanup(BARCODE);
    await barcodes.create({
      barcode: BARCODE
    });

    await request(publicApp)
      .get("/api/validateBarcode/" + BARCODE)
      .send()
      .expect(200);

    await cleanup(BARCODE);
  });

  async function cleanup(barcode: string) {
    await barcodes.destroy({
      where: {
        barcode
      }
    });
  }
});
