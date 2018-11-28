import request from "supertest";
import app from "../../src/app";
import { Visit } from "../../src/models/visit";
import { AccessKey } from "../../src/models/accessKey";

const DOCUMENT_ID = "ABC123-_".repeat(8);
const DOCUMENT_CONTENTS = {
  csruid: DOCUMENT_ID,
  device: { info: "fakeDeviceInfo" },
  visit: { data: "fakeVisitData" }
};

describe("putDocument", () => {
  it("rejects malformed json", async () => {
    const response = await request(app)
      .put(`/api/documents/${DOCUMENT_ID}`)
      .send("{ bad json")
      .set("Content-Type", "application/json")
      .expect(400);
  });

  it("converts invalid UTF8 to replacement characters", async () => {
    const contents = {
      device: { info: "☢" },
      csruid: DOCUMENT_ID,
      visit: { data: "fakeVisitData" }
    };
    const contentsBuffer = Buffer.from(JSON.stringify(contents));

    // Manually edit the buffer to replace the ☢ symbol with an invalid byte seqence
    contentsBuffer[19] = 0xed;
    contentsBuffer[20] = 0xa0;
    contentsBuffer[21] = 0x80;

    const req = request(app)
      .put(`/api/documents/${DOCUMENT_ID}`)
      .set("Content-Type", "application/json");
    req.write(contentsBuffer);
    await req.expect(200);

    const visit = await Visit.findOne({ where: { csruid: DOCUMENT_ID } });
    expect(visit.device).not.toEqual(contents.device);
    expect(visit.device).toEqual({ info: "���" });

    await Visit.destroy({ where: { csruid: DOCUMENT_ID } });
  });

  it("adds the document to the visits table", async () => {
    const response = await request(app)
      .put(`/api/documents/${DOCUMENT_ID}`)
      .send(DOCUMENT_CONTENTS)
      .expect(200);

    const visit = await Visit.findOne({ where: { csruid: DOCUMENT_ID } });
    expect(visit.csruid).toEqual(DOCUMENT_ID);
    expect(visit.device).toEqual(DOCUMENT_CONTENTS.device);
    expect(visit.visit).toEqual(DOCUMENT_CONTENTS.visit);

    await Visit.destroy({ where: { csruid: DOCUMENT_ID } });
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

    await Visit.destroy({ where: { csruid: DOCUMENT_ID } });
  });
});
describe("putDocumentWithKey", () => {
  const BAD_ACCESS_KEY = "thisisNOTanaccesskey12345";
  it("accepts a docuent with a valid key", async () => {
    const accessKey = await AccessKey.create({
      key: "accesskey1",
      valid: true
    });

    await request(app)
      .put(`/api/documents/${accessKey.key}/${DOCUMENT_ID}`)
      .send(DOCUMENT_CONTENTS)
      .expect(200);

    const newVisit = await Visit.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    expect(newVisit).not.toBeNull();

    await newVisit.destroy();
    await accessKey.destroy();
  });
  it("rejects a docuent with a bogus key", async () => {
    const accessKey = await AccessKey.create({
      key: "accesskey2",
      valid: true
    });

    await request(app)
      .put(`/api/documents/notaccesskey2/${DOCUMENT_ID}`)
      .send(DOCUMENT_CONTENTS)
      .expect(404);

    const newVisit = await Visit.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    expect(newVisit).toBeNull();

    await accessKey.destroy();
  });
  it("rejects a docuent with key that's no longer valid", async () => {
    const accessKey = await AccessKey.create({
      key: "accesskey3",
      valid: false
    });

    await request(app)
      .put(`/api/documents/${accessKey.key}/${DOCUMENT_ID}`)
      .send(DOCUMENT_CONTENTS)
      .expect(404);

    const newVisit = await Visit.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    expect(newVisit).toBeNull();

    await accessKey.destroy();
  });
});
