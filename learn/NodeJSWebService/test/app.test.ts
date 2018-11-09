import request from "supertest";
import { promises as fs } from "fs";
import app from "../src/app";
import { ButtonPush } from "../src/models/buttonPush";
import { Visit } from "../src/models/visit";
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

  it("adds the document to the visits table", async () => {
    await Visit.destroy({ where: { csruid: DOCUMENT_ID } });
    const contents = {
      csruid: DOCUMENT_ID,
      device: { info: "fakeDeviceInfo" },
      visit: { data: "fakeVisitData" }
    };

    const response = await request(app)
      .put(`/api/documents/${DOCUMENT_ID}`)
      .send(contents)
      .expect(200);

    const visit = await Visit.findOne({ where: { csruid: DOCUMENT_ID } });
    expect(visit.csruid).toEqual(DOCUMENT_ID);
    expect(visit.device).toEqual(contents.device);
    expect(visit.visit).toEqual(contents.visit);
  });

  it("updates an existing document in the visits table", async () => {
    await Visit.upsert({
      csruid: DOCUMENT_ID,
      device: { info: "fakeDeviceInfo" },
      visit: { data: "fakeVisitData" }
    });

    const newContents = {
      csruid: DOCUMENT_ID,
      device: { info: "fakeDeviceInfo" },
      visit: { data: "new fakeVisitData" }
    };
    const response = await request(app)
      .put(`/api/documents/${DOCUMENT_ID}`)
      .send(newContents)
      .expect(200);

    const newVisit = await Visit.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    expect(newVisit.visit).toEqual(newContents.visit);
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
