// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import request from "supertest";
import { createSplitSql } from "../../src/util/sql";
import { createPublicApp } from "../../src/app";
import { AuthManager } from "../../src/endpoints/webPortal/auth";
import { createTestSessionStore } from "../../src/endpoints/webPortal/endpoint";
import { defineSession } from "../../src/endpoints/webPortal/models";

describe("webPortal", () => {
  let sql;
  let publicApp;
  let auth;
  let username = "AzureDiamond";
  let password = "hunter2";

  beforeAll(async done => {
    sql = createSplitSql();
    const sessionStore = createTestSessionStore(sql);
    publicApp = await createPublicApp({ sql, sessionStore });
    auth = new AuthManager(sql);
    await auth.createUser(username, password);
    done();
  });

  afterAll(async done => {
    await auth.deleteUser(username);
    await defineSession(sql).destroy({ where: {} });
    await sql.close();
    done();
  });

  it("Allows getting favicon", async () => {
    await request(publicApp)
      .get("/portal/favicon-32x32.png")
      .expect(200);
  });

  it("Allows getting css", async () => {
    await request(publicApp)
      .get("/portal/css/common.css")
      .expect(200);
  });

  it("Allows getting login", async () => {
    await request(publicApp)
      .get("/portal/login")
      .expect(200);
  });

  it("Redirects index if not logged in", async () => {
    await request(publicApp)
      .get("/portal/index")
      .expect(302);
  });

  it("Allows logging in", async () => {
    const req = request(publicApp);

    let login;
    await req
      .get("/portal/login")
      .expect(200)
      .expect(res => (login = res));

    const loginCSRF = getCSRF(login.text);
    expect(loginCSRF).not.toBeNull();

    let post;
    await req
      .post("/portal/login")
      .type("form")
      .set("Cookie", login.headers["set-cookie"])
      .send({
        _csrf: loginCSRF,
        username,
        password
      })
      .expect(302, /\/portal\/index$/)
      .expect(res => (post = res));

    await req
      .get("/portal/index")
      .set("Cookie", post.headers["set-cookie"])
      .expect(200);
  });

  it("Fails if no CSRF token", async () => {
    const req = request(publicApp);

    let login;
    await req
      .get("/portal/login")
      .expect(200)
      .expect(res => (login = res));

    await req
      .post("/portal/login")
      .type("form")
      .set("Cookie", login.headers["set-cookie"])
      .send({
        // _csrf: loginCSRF,
        username,
        password
      })
      .expect(403);
  });

  it("Fails if no user in db", async () => {
    const req = request(publicApp);

    let login;
    await req
      .get("/portal/login")
      .expect(200)
      .expect(res => (login = res));

    const loginCSRF = getCSRF(login.text);
    expect(loginCSRF).not.toBeNull();

    let post;
    await req
      .post("/portal/login")
      .type("form")
      .set("Cookie", login.headers["set-cookie"])
      .send({
        _csrf: loginCSRF,
        username: "incorrect",
        password
      })
      .expect(302, /\/portal\/login$/);
  });

  it("Fails if incorrect password", async () => {
    const req = request(publicApp);

    let login;
    await req
      .get("/portal/login")
      .expect(200)
      .expect(res => (login = res));

    const loginCSRF = getCSRF(login.text);
    expect(loginCSRF).not.toBeNull();

    let post;
    await req
      .post("/portal/login")
      .type("form")
      .set("Cookie", login.headers["set-cookie"])
      .send({
        _csrf: loginCSRF,
        username,
        password: "incorrect"
      })
      .expect(302, /\/portal\/login$/);
  });
});

function getCSRF(text: string): string {
  const match = /<input type="hidden" name="_csrf" value="([0-9a-zA-Z_-]*)">/.exec(
    text
  );
  if (match == null) {
    throw new Error(`Could not locate CSRF control in '${text}'`);
  }
  return match[1];
}
