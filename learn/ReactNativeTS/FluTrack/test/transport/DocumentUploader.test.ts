import Axios, { AxiosInstance, AxiosResponse } from "axios";
import PouchDB from "pouchdb";
import {
  anyString,
  anything,
  capture,
  instance,
  mock,
  spy,
  verify,
  when,
} from "ts-mockito";
import { DocumentType } from "audere-lib";
import { DocumentUploader } from "../../src/transport/DocumentUploader";
import { PouchDoc } from "../../src/transport/Types";
import { axiosResponse, nextCall } from "../util";

const FAKE_VISIT_RECORD = {
  _id: "documents/fakeRecordId",
  priority: 0,
  body: { document: "someFakeData" },
};
const FAKE_CSRUID = "abc123";

describe("DocumentUploader", () => {
  describe("save", () => {
    let uploader: DocumentUploader, mockAxios: AxiosInstance, mockPouchDB: any;
    beforeEach(() => {
      const api = Axios.create();
      mockAxios = spy(api);
      mockPouchDB = mock(PouchDB);
      uploader = new DocumentUploader(instance(mockPouchDB), api);
    });
    it("adds visit info to the pouchDB record", async () => {
      when(mockPouchDB.get("fakeUID")).thenReturn({ body: {} });

      uploader.save("fakeUID", FAKE_VISIT_RECORD, DocumentType.Visit, 0);

      await nextCall(mockPouchDB, "put", [anything()]);
      const newRecord = capture(mockPouchDB.put).last()[0] as PouchDoc;
      expect(newRecord.body.document).toEqual(FAKE_VISIT_RECORD);
    });
    it("uploads a saved record to the api server", async () => {
      const contents = {
        total_rows: 1,
        rows: [{ doc: JSON.parse(JSON.stringify(FAKE_VISIT_RECORD)) }],
      };
      when(mockPouchDB.allDocs()).thenReturn(contents);
      when(mockPouchDB.allDocs(anything())).thenReturn(contents);
      uploader.save("fakeUID", FAKE_VISIT_RECORD, DocumentType.Visit, 0);

      when(mockAxios.get("/documentId")).thenReturn(
        axiosResponse({ id: FAKE_CSRUID })
      );
      await nextCall(
        mockAxios,
        "put",
        [anyString(), anything()],
        axiosResponse()
      );
      const [url, postData] = capture(mockAxios.put as any).last();
      expect(postData).toEqual({
        csruid: FAKE_CSRUID,
        ...FAKE_VISIT_RECORD.body,
      });
      expect(url).toEqual(`/documents/${FAKE_CSRUID}`);
    });
  });
  describe("firstDocument", () => {
    let db: PouchDB.Database;
    beforeEach(() => {
      db = new PouchDB("testDB");
    });
    afterEach(done => {
      db.destroy({}, done);
    });
    it("returns documents in priority order", async () => {
      const uploader = new DocumentUploader(db, Axios.create());
      const docB = await db.put({
        _id: "documents/1/1",
        body: { document: { data: "b" } },
      });
      const docA = await db.put({
        _id: "documents/0/2",
        body: { document: { data: "a" } },
      });
      const docC = await db.put({
        _id: "documents/2/3",
        body: { document: { data: "c" } },
      });

      let doc = await uploader["firstDocument"]();
      expect(doc!.body.document.data).toEqual("a");
      await db.remove(docA.id, docA.rev);
      doc = await uploader["firstDocument"]();
      expect(doc!.body.document.data).toEqual("b");
      await db.remove(docB.id, docB.rev);
      doc = await uploader["firstDocument"]();
      expect(doc!.body.document.data).toEqual("c");
      await db.remove(docC.id, docC.rev);
    });
  });
});
