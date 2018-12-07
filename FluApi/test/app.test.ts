import request from "supertest";
import { promises as fs } from "fs";
import app from "../src/app";
import { sequelize } from "../src/models";

afterAll(() => {
  sequelize.close();
});

describe("GET /", () => {
  it("returns 200 OK", async () => {
    await request(app)
      .get("/")
      .expect(200)
      .expect("OK");
  });
});

describe("GET /api", () => {
  it("returns CSRF token", async () => {
    const response = await request(app)
      .get("/api")
      .expect(200)
      .expect("content-type", /json/);
    expect(response.body.Status).toEqual("SUCCESS");
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
