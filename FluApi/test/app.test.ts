import request from "supertest";
import { createPublicApp } from "../src/app";
import { createSplitSql, SplitSql } from "../src/util/sql";

let publicApp;
let sql: SplitSql;

beforeAll(async () => {
  sql = createSplitSql();
  publicApp = await createPublicApp(sql);
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
