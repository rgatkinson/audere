import request from "supertest";
import { promises as fs } from "fs";
import app from "../src/app";
import { ButtonPush } from "../src/models/buttonPush";
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

describe("POST /api/button", () => {
  it("creates new record", async () => {
    const response = await request(app)
      .post("/api/button")
      .send({
        DeviceId: "53c86569-2f33-4829-945c-18b4718e2388",
        Timestamp: "2018-09-26T03:40:25.693Z",
        Count: 42
      })
      .expect(200)
      .expect("content-type", /json/);
    expect(response.body.Status).toEqual("SUCCESS");
    const buttonPush: any = await ButtonPush.findOne({
      where: {
        deviceId: "53c86569-2f33-4829-945c-18b4718e2388",
        timestamp: "2018-09-26T03:40:25.693Z"
      }
    });
    expect(buttonPush.count).toEqual(42);
  });

  it("validates arguments", async () => {
    const response = await request(app)
      .post("/api/button")
      .send({})
      .expect(400)
      .expect("content-type", /json/);
    expect(response.body.Status).toMatch(/deviceId/);
  });
});

describe("PUT /api/documents/...", () => {
  const DOCUMENT_ID = "ABC123-_".repeat(8);

  it("writes out the document", async () => {
    const filePath = `/tmp/${DOCUMENT_ID}`;
    const contents = { contents: "Here's some data :O" };
    try {
      await fs.unlink(filePath);
    } catch {}
    const response = await request(app)
      .put(`/api/documents/${DOCUMENT_ID}`)
      .send(contents)
      .expect(200);
    await fs.stat(filePath);
    expect(await fs.readFile(filePath, { encoding: "utf8" })).toEqual(
      JSON.stringify(contents)
    );
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
