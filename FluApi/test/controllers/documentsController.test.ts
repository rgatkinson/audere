import request from "supertest";
import {
  DocumentType,
  VisitDocument,
  VisitInfo,
  VisitNonPIIDbInfo,
  VisitPIIInfo,
  VisitCommonInfo,
  EventInfoKind
} from "audere-lib";
import app from "../../src/app";
import { VisitNonPII, VisitPII } from "../../src/models/visit";
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
  code: "Code"
};
const NONPII_RESPONSE_ITEM = {
  id: "CakeVeracity",
  text: "Is the cake a lie?",
  answer: [{ valueBoolean: true }]
};
const PII_RESPONSE_ITEM = {
  id: "BirthDate",
  text: "What is your birth date?",
  answer: [{ valueString: "1900-01-01" }]
};

const VISIT_COMMON_INFO: VisitCommonInfo = {
  isDemo: false,
  complete: true,
  location: "Location Name",
  administrator: "Administrator Name",
  events: [
    {
      kind: EventInfoKind.Visit,
      at: "2019-01-01T00:00:00Z",
      until: "2019-01-01T01:00:00Z"
    }
  ]
};
const VISIT_NONPII: VisitNonPIIDbInfo = {
  ...VISIT_COMMON_INFO,
  samples: [SAMPLE_INFO],
  giftcards: [],
  consents: [],
  responses: [
    {
      id: "Questionnaire",
      item: [NONPII_RESPONSE_ITEM]
    }
  ]
};
const VISIT_PII: VisitPIIInfo = {
  ...VISIT_COMMON_INFO,
  patient: PATIENT_INFO,
  consents: [],
  responses: [
    {
      id: "Questionnaire",
      item: [PII_RESPONSE_ITEM]
    }
  ]
};
const VISIT_INFO: VisitInfo = {
  ...VISIT_NONPII,
  ...VISIT_PII,
  responses: [
    {
      id: "Questionnaire",
      item: [PII_RESPONSE_ITEM, NONPII_RESPONSE_ITEM]
    }
  ]
};

const DOCUMENT_CONTENTS: VisitDocument = {
  schemaId: 1,
  csruid: DOCUMENT_ID,
  documentType: DocumentType.Visit,
  device: DEVICE,
  visit: VISIT_INFO
};
const NONPII_DOCUMENT_CONTENTS = {
  csruid: DOCUMENT_ID,
  device: DEVICE,
  visit: VISIT_NONPII
};
const PII_DOCUMENT_CONTENTS = {
  csruid: DOCUMENT_ID,
  device: DEVICE,
  visit: VISIT_PII
};

describe("putDocument", () => {
  let accessKey;
  beforeAll(async done => {
    accessKey = await AccessKey.create({
      key: "accesskey1",
      valid: true
    });
    done();
  });

  afterAll(async done => {
    await accessKey.destroy();
    done();
  });

  it("rejects malformed json", async () => {
    const response = await request(app)
      .put(`/api/documents/${accessKey.key}/${DOCUMENT_ID}`)
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
      .put(`/api/documents/${accessKey.key}/${DOCUMENT_ID}`)
      .set("Content-Type", "application/json");
    req.write(contentsBuffer);
    await req.expect(200);

    const visit = await VisitNonPII.findOne({ where: { csruid: DOCUMENT_ID } });
    expect(visit.device).not.toEqual(contents.device);
    expect(visit.device).toEqual({ info: "���" });

    await visit.destroy();
  });

  it("adds the document to the visits table in each db", async () => {
    const response = await request(app)
      .put(`/api/documents/${accessKey.key}/${DOCUMENT_ID}`)
      .send(DOCUMENT_CONTENTS)
      .expect(200);

    const visitNonPII = await VisitNonPII.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    expect(visitNonPII.csruid).toEqual(DOCUMENT_ID);
    expect(visitNonPII.device).toEqual(DOCUMENT_CONTENTS.device);
    expect(visitNonPII.visit).toEqual(VISIT_NONPII);
    await visitNonPII.destroy();

    const visitPII = await VisitPII.findOne({ where: { csruid: DOCUMENT_ID } });
    expect(visitPII.csruid).toEqual(DOCUMENT_ID);
    expect(visitPII.visit).toEqual(VISIT_PII);
    await visitPII.destroy();
  });

  it("updates existing documents in visits table in PII db", async () => {
    await VisitNonPII.upsert(NONPII_DOCUMENT_CONTENTS);
    await VisitPII.upsert(PII_DOCUMENT_CONTENTS);

    const newPatient = { ...PATIENT_INFO, name: "New Fake Name" };
    const newProtocolContents: VisitDocument = {
      ...DOCUMENT_CONTENTS,
      visit: {
        ...VISIT_INFO,
        patient: newPatient
      }
    };

    const response = await request(app)
      .put(`/api/documents/${accessKey.key}/${DOCUMENT_ID}`)
      .send(newProtocolContents)
      .expect(200);

    const newPIIVisit = await VisitPII.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    const newVisitDoc = newPIIVisit.visit as VisitInfo;
    expect(newVisitDoc.patient.name).toEqual("New Fake Name");
    expect(newVisitDoc).toEqual({ ...VISIT_PII, patient: newPatient });
    await newPIIVisit.destroy();

    const newNonPIIVisit = await VisitNonPII.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    expect(newNonPIIVisit.visit).toEqual(NONPII_DOCUMENT_CONTENTS.visit);
    await newNonPIIVisit.destroy();
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

    const newVisitNonPII = await VisitNonPII.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    expect(newVisitNonPII).not.toBeNull();

    const newVisitPII = await VisitPII.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    expect(newVisitPII).not.toBeNull();

    await newVisitNonPII.destroy();
    await newVisitPII.destroy();
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

    const newVisitNonPII = await VisitNonPII.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    expect(newVisitNonPII).toBeNull();

    const newVisitPII = await VisitPII.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    expect(newVisitPII).toBeNull();

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

    const newVisitNonPII = await VisitNonPII.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    expect(newVisitNonPII).toBeNull();

    const newVisitPII = await VisitPII.findOne({
      where: { csruid: DOCUMENT_ID }
    });
    expect(newVisitPII).toBeNull();

    await accessKey.destroy();
  });
});
