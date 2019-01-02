import request from "supertest";
import { DocumentType, VisitDocument, VisitCoreDocument, VisitIdentityDocument, VisitInfo, VisitCoreInfo, VisitIdentityInfo, VisitCommonInfo, EventInfoKind } from "audere-lib";
import app from "../../src/app";
import { VisitCore, VisitIdentity } from "../../src/models/visit";
import { AccessKey } from "../../src/models/accessKey";

const DOCUMENT_ID = "ABC123-_".repeat(8);
const DEVICE = {
  installation: "uuid",
  clientVersion: "1.2.3-testing",
  deviceName: "My Phone",
  yearClass: "2020",
  idiomText: "handset",
  platform: "iOS"
};
const PATIENT_INFO = {
  name: "Fake Name",
  birthDate: "1900-01-01",
  telecom: [],
  address: []
};
const SAMPLE_INFO = {
  sample_type: "SampleType",
  code: "Code",
};
const PHI_RESPONSE = {
  id: "CakeVeracity",
  item: [{
    id: "CakeVeracity",
    text: "Is the cake a lie?",
    answer: [{ valueBoolean: true }]
  }]
};
const PII_RESPONSE = {
  id: "BirthDate",
  item: [{
    id: "BirthDate",
    text: "What is your birth date?",
    answer: [{ valueString: "1900-01-01" }]
  }]
};
const VISIT_COMMON_INFO: VisitCommonInfo = {
  complete: true,
  location: "Location Name",
  administrator: "Administrator Name",
  events: [
    {
      kind: EventInfoKind.Visit,
      at: "2019-01-01T00:00:00Z",
      until: "2019-01-01T01:00:00Z",
    }
  ],
};
const VISIT_CORE_INFO: VisitCoreInfo = {
  ...VISIT_COMMON_INFO,
  samples: [ SAMPLE_INFO ],
  giftcards: [],
  responses: [ PHI_RESPONSE ],
};
const VISIT_IDENTITY_INFO: VisitIdentityInfo = {
  ...VISIT_COMMON_INFO,
  patient: PATIENT_INFO,
  consents: [],
  responses: [ PII_RESPONSE ],
}
const VISIT_INFO: VisitInfo = {
  ...VISIT_CORE_INFO,
  ...VISIT_IDENTITY_INFO,
  responses: [
    ...VISIT_CORE_INFO.responses,
    ...VISIT_IDENTITY_INFO.responses,
  ],
};
const DOCUMENT_CONTENTS: VisitDocument = {
  schemaId: 1,
  csruid: DOCUMENT_ID,
  documentType: DocumentType.Visit,
  device: DEVICE,
  visit: VISIT_INFO,
};
const CORE_DOCUMENT_CONTENTS: VisitCoreDocument = {
  schemaId: 1,
  csruid: DOCUMENT_ID,
  documentType: DocumentType.VisitCore,
  device: DEVICE,
  visit: VISIT_CORE_INFO,
};
const IDENTITY_DOCUMENT_CONTENTS: VisitIdentityDocument = {
  schemaId: 1,
  csruid: DOCUMENT_ID,
  documentType: DocumentType.VisitIdentity,
  device: DEVICE,
  visit: VISIT_IDENTITY_INFO,
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
      documentType: DocumentType.Visit,
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

    const visit = await VisitCore.findOne({ where: { csruid: DOCUMENT_ID } });
    expect(visit.device).not.toEqual(contents.device);
    expect(visit.device).toEqual({ info: "���" });

    await visit.destroy();
  });

  it("adds the document to the visits table in each db", async () => {
    const response = await request(app)
      .put(`/api/documents/${DOCUMENT_ID}`)
      .send(DOCUMENT_CONTENTS)
      .expect(200);

    const visitCore = await VisitCore.findOne({ where: { csruid: DOCUMENT_ID } });
    expect(visitCore.csruid).toEqual(DOCUMENT_ID);
    expect(visitCore.device).toEqual(DOCUMENT_CONTENTS.device);
    expect(visitCore.visit).toEqual(VISIT_CORE_INFO);
    await visitCore.destroy();

    const visitIdentity = await VisitIdentity.findOne({ where: { csruid: DOCUMENT_ID } });
    expect(visitIdentity.csruid).toEqual(DOCUMENT_ID);
    expect(visitIdentity.visit).toEqual(VISIT_IDENTITY_INFO);
    await visitIdentity.destroy();
  });

  it("updates existing documents in visits table in identity db", async () => {
    await VisitCore.upsert(CORE_DOCUMENT_CONTENTS);
    await VisitIdentity.upsert(IDENTITY_DOCUMENT_CONTENTS);

    const newPatient = { ...PATIENT_INFO, name: "New Fake Name" };
    const newProtocolContents: VisitDocument = {
      ...DOCUMENT_CONTENTS,
      visit: {
        ...VISIT_INFO,
        patient: newPatient,
      }
    };
    const newIdentityContents: VisitIdentityDocument = {
      ...IDENTITY_DOCUMENT_CONTENTS,
      visit: {
        ...VISIT_IDENTITY_INFO,
        patient: newPatient,
      }
    };

    const response = await request(app)
      .put(`/api/documents/${DOCUMENT_ID}`)
      .send(newProtocolContents)
      .expect(200);

    const newIdentityVisit = await VisitIdentity.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    const newVisitDoc = newIdentityVisit.visit as VisitInfo;
    expect(newVisitDoc.patient.name).toEqual("New Fake Name");
    expect(newVisitDoc).toEqual({...VISIT_IDENTITY_INFO, patient: newPatient});
    await newIdentityVisit.destroy();

    const newCoreVisit = await VisitCore.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    expect(newCoreVisit.visit).toEqual(CORE_DOCUMENT_CONTENTS.visit);
    await newCoreVisit.destroy();
  });
});
describe("putDocumentWithKey", () => {
  it("accepts a docuent with a valid key", async () => {
    const accessKey = await AccessKey.create({
      key: "accesskey1",
      valid: true
    });

    await request(app)
      .put(`/api/documents/${accessKey.key}/${DOCUMENT_ID}`)
      .send(DOCUMENT_CONTENTS)
      .expect(200);

    const newVisitCore = await VisitCore.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    expect(newVisitCore).not.toBeNull();

    const newVisitIdentity = await VisitIdentity.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    expect(newVisitIdentity).not.toBeNull();

    await newVisitCore.destroy();
    await newVisitIdentity.destroy();
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

    const newVisitCore = await VisitCore.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    expect(newVisitCore).toBeNull();

    const newVisitIdentity = await VisitIdentity.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    expect(newVisitIdentity).toBeNull();

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

    const newVisitCore = await VisitCore.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    expect(newVisitCore).toBeNull();

    const newVisitIdentity = await VisitIdentity.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    expect(newVisitIdentity).toBeNull();

    await accessKey.destroy();
  });
});
