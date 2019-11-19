// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import request from "supertest";
import uuidv4 from "uuid/v4";
import { pbkdf2 } from "../../src/util/crypto";
import { createPublicApp } from "../../src/app";
import { createTestSessionStore } from "../../src/endpoints/webPortal/endpoint";
import { ChillsModels, defineChillsModels } from "../../src/models/db/chills";
import { createSplitSql } from "../../src/util/sql";
import { Express } from "express";

describe("Chills match kit", () => {
  let accessKey = "accesskey1";
  let publicApp: Express;
  let models: ChillsModels;

  beforeAll(async done => {
    const sql = createSplitSql();
    const sessionStore = createTestSessionStore(sql);
    publicApp = await createPublicApp({ sql, sessionStore });
    models = defineChillsModels(sql);

    await models.accessKey.create({
      key: accessKey,
      valid: true,
    });

    await cleanDb();
    done();
  });

  afterAll(async done => {
    await models.accessKey.destroy({
      where: {
        key: accessKey,
      },
    });
    done();
  });

  afterEach(async done => {
    await cleanDb();
    done();
  });

  async function cleanDb() {
    await Promise.all([
      models.shippedKits.destroy({ where: {} }),
      models.matchedKits.destroy({ where: {} }),
    ]);
  }

  it("should reject requests without a valid access key", async () => {
    const barcode = "123456789Z";
    const id = `${uuidv4()}.${uuidv4()}`;

    await request(publicApp)
      .post("/api/chills/matchBarcode")
      .set("Content-Type", "application/json")
      .send({ secret: accessKey + accessKey, id, barcode })
      .expect(400);
  });

  it("should reject invalid barcodes", async () => {
    const id = `${uuidv4()}.${uuidv4()}`;

    await request(publicApp)
      .post("/api/chills/matchBarcode")
      .set("Content-Type", "application/json")
      .send({ secret: accessKey, id })
      .expect(400);

    await request(publicApp)
      .post("/api/chills/matchBarcode")
      .set("Content-Type", "application/json")
      .send({ secret: accessKey, id, barcode: "barcode" })
      .expect(400);

    await request(publicApp)
      .post("/api/chills/matchBarcode")
      .set("Content-Type", "application/json")
      .send({ secret: accessKey, id, barcode: 12345 })
      .expect(400);
  });

  it("should reject invalid ids", async () => {
    await request(publicApp)
      .post("/api/chills/matchBarcode")
      .set("Content-Type", "application/json")
      .send({ secret: accessKey, barcode: 1234567890 })
      .expect(400);

    await request(publicApp)
      .post("/api/chills/matchBarcode")
      .set("Content-Type", "application/json")
      .send({ secret: accessKey, id: 123, barcode: 1234567890 })
      .expect(400);

    await request(publicApp)
      .post("/api/chills/matchBarcode")
      .set("Content-Type", "application/json")
      .send({ secret: accessKey, id: "id", barcode: 1234567890 })
      .expect(400);

    await request(publicApp)
      .post("/api/chills/matchBarcode")
      .set("Content-Type", "application/json")
      .send({ secret: accessKey, id: uuidv4(), barcode: 1234567890 })
      .expect(400);
  });

  it("should match an existing barcode", async () => {
    const barcode = "123456789Z";
    const id = `${uuidv4()}.${uuidv4()}`;

    await models.shippedKits.upsert({
      evidationId: "evidation1",
      barcode: barcode,
      email: "test@test.com",
      birthdate: "2019-01-01",
      sex: "Male",
      city: "Newhaven",
      state: "CT",
      postalCode: "06501",
      orderedAt: "2019-03-14 16:51:46 +0000",
      demo: false,
    });

    await request(publicApp)
      .post("/api/chills/matchBarcode")
      .set("Content-Type", "application/json")
      .send({ secret: accessKey, id, barcode })
      .expect(200)
      .expect(res => expect(res.body.email).toBe("t**t@test.com"))
      .expect(res =>
        expect(pbkdf2("test@test.com", res.body.emailSalt)).toBe(
          res.body.emailHash
        )
      )
      .expect(res => expect(res.body.state).toBe("CT"))
      .expect(res => expect(res.body.city).toBe("Newhaven"));

    const match = await models.matchedKits.findOne({
      where: {
        barcode,
      },
    });

    expect(match.identifier).toBe(id.split(".")[0]);
  });

  it("should not match a non-existent barcode", async () => {
    const barcode = "123456789Z";
    const id = `${uuidv4()}.${uuidv4()}`;

    await request(publicApp)
      .post("/api/chills/matchBarcode")
      .set("Content-Type", "application/json")
      .send({ secret: accessKey, id, barcode })
      .expect(404);

    const match = await models.matchedKits.findOne({
      where: {
        barcode,
      },
    });

    expect(match).toBeNull();
  });

  it("should match demo kits and non-demo kits separately", async () => {
    const barcode1 = "123456789Z";
    const id1 = `${uuidv4()}.${uuidv4()}`;
    const barcode2 = "987654321Z";
    const id2 = `${uuidv4()}.${uuidv4()}`;

    await models.shippedKits.bulkCreate([
      {
        evidationId: "evidation1",
        barcode: barcode1,
        email: "melody@song.com",
        birthdate: "2019-01-01",
        sex: "Male",
        city: "Newhaven",
        state: "CT",
        postalCode: "06501",
        orderedAt: "2019-03-14 16:51:46 +0000",
        demo: false,
      },
      {
        evidationId: "evidation2",
        barcode: barcode2,
        email: "test@test.com",
        birthdate: "2017-06-15",
        sex: "Female",
        city: "Dearborn",
        state: "MI",
        postalCode: "48120",
        orderedAt: "2019-02-24 10:11:38 +0000",
        demo: true,
      },
    ]);

    await request(publicApp)
      .post("/api/chills/matchBarcode")
      .set("Content-Type", "application/json")
      .send({ secret: accessKey, id: id1, barcode: barcode1, demo: true })
      .expect(404);

    await request(publicApp)
      .post("/api/chills/matchBarcode")
      .set("Content-Type", "application/json")
      .send({ secret: accessKey, id: id2, barcode: barcode2, demo: false })
      .expect(404);
  });
});
