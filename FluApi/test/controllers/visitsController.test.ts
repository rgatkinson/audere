import request from "supertest";
import app from "../../src/app";
import { Visit } from "../../src/models/visit";

describe("PUT /api/documents/...", () => {
  const DOCUMENT_ID = "ABC123-_".repeat(8);

  it("rejects malformed json", async () => {
    const response = await request(app)
      .put(`/api/documents/${DOCUMENT_ID}`)
      .send("{ bad json")
      .set("Content-Type", "application/json")
      .expect(400);
  });

  it.skip("rejects invalid UTF8 characters in json", async () => {
    const response = await request(app)
      .put(`/api/documents/${DOCUMENT_ID}`)
      .send('{ "bad character": "\uD800"}')
      .set("Content-Type", "application/json")
      .expect(400);
  });

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
