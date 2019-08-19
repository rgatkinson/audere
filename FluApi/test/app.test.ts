// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import request from "supertest";
import { createPublicApp } from "../src/app";
import { getSql } from "../src/util/sql";
import { createTestSessionStore } from "../src/endpoints/webPortal/endpoint";

let publicApp;
let sql;

beforeAll(async () => {
  sql = getSql();
  const sessionStore = createTestSessionStore(sql);
  publicApp = await createPublicApp({ sql, sessionStore });
});

afterAll(() => {
  sql.close();
});

describe("GET /api", () => {
  it("returns OK", async () => {
    const response = await request(publicApp)
      .get("/api")
      .expect(200)
      .expect("content-type", /json/);
    expect(response.body.Status).toEqual("OK");
  });
});

describe("GET /about", () => {
  it("shows build date", async () => {
    const response = await request(publicApp)
      .get("/about")
      .expect(200)
      .expect("content-type", /json/);
    expect(response.body.buildDate).toMatch(/[0-9]{8}/);
  });
});
