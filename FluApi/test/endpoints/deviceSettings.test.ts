// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import request from "supertest";
import { createSplitSql } from "../../src/util/sql";
import { createPublicApp } from "../../src/app";
import { createTestSessionStore } from "../../src/endpoints/webPortal/endpoint";
import { defineDeviceSetting } from "../../src/models/db/devices";

describe("getDeviceSetting", () => {
  let sql;
  let deviceSetting;
  let publicApp;

  beforeAll(async done => {
    sql = createSplitSql();
    deviceSetting = defineDeviceSetting(sql);
    const sessionStore = createTestSessionStore(sql);
    publicApp = await createPublicApp({ sql, sessionStore });
    done();
  });

  afterAll(async done => {
    await sql.close();
    done();
  });

  it("normally returns 404", async () => {
    await cleanup("abc", "def");
    await request(publicApp)
      .get("/api/settings/abc/def")
      .send()
      .expect(404);
  });

  it("returns settings", async () => {
    await cleanup("abc", "def");
    await deviceSetting.create({
      device: "abc",
      key: "def",
      setting: "ghi",
    });

    await request(publicApp)
      .get("/api/settings/abc/def")
      .send()
      .expect(200);

    await cleanup("abc", "def");
  });

  async function cleanup(device: string, key: string) {
    await deviceSetting.destroy({
      where: {
        device,
        key,
      },
    });
  }
});
