import request from "supertest";
import { promises as fs } from "fs";
import app from "../src/app";
import { sequelizeNonPII, sequelizePII } from "../src/models";

afterAll(() => {
  sequelizeNonPII.close();
  sequelizePII.close();
});

describe("GET /api", () => {
  it("returns OK", async () => {
    const response = await request(app)
      .get("/api")
      .expect(200)
      .expect("content-type", /json/);
    expect(response.body.Status).toEqual("OK");
  });
});

describe("GET /about", () => {
  it("shows build date", async () => {
    const response = await request(app)
      .get("/about")
      .expect(200)
      .expect("content-type", /json/);
    expect(response.body.buildDate).toMatch(/[0-9]{8}/);
  });
});
