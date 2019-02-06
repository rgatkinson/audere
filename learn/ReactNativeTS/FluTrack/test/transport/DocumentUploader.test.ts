// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import Axios, { AxiosInstance, AxiosResponse } from "axios";
import PouchDB from "pouchdb";
import CryptoPouch from "crypto-pouch";
import {
  anyString,
  anything,
  capture,
  instance,
  match,
  mock,
  spy,
  verify,
  when,
} from "ts-mockito";
import { DocumentType, VisitInfo } from "audere-lib/snifflesProtocol";
import {
  DocumentUploader,
  CSRUID_PLACEHOLDER,
} from "../../src/transport/DocumentUploader";
import { PouchDoc } from "../../src/transport/Types";
import { ArrayLogger, axiosResponse, nextCall } from "../util";
import { DEVICE_INFO } from "../../src/transport/DeviceInfo";

const EMPTY_POUCH_CONTENTS = {
  total_rows: 0,
  rows: [],
};

const FAKE_VISIT_CONTENTS: VisitInfo = {
  complete: false,
  samples: [],
  giftcards: [],
  patient: {
    name: "Some Fake Name",
    telecom: [],
    address: [],
  },
  consents: [],
  responses: [],
  events: [],
};

const FAKE_CSRUID = "abc123";

const FAKE_POUCH_DOC: PouchDoc = {
  _id: "documents/random_id",
  body: {
    documentType: DocumentType.Visit,
    schemaId: 1,
    csruid: CSRUID_PLACEHOLDER,
    device: DEVICE_INFO,
    visit: JSON.parse(JSON.stringify(FAKE_VISIT_CONTENTS)),
  },
};

const logger = new ArrayLogger();

describe("DocumentUploader", () => {
  describe("save", () => {
    let uploader: DocumentUploader, mockAxios: AxiosInstance, mockPouchDB: any;
    beforeEach(() => {
      const api = Axios.create();
      mockAxios = spy(api);
      when(mockAxios.get(match("/randomBytes/.*"))).thenReturn(
        axiosResponse({ bytes: "" })
      );
      PouchDB.plugin(CryptoPouch);
      mockPouchDB = mock(PouchDB);
      uploader = new DocumentUploader(instance(mockPouchDB), api, logger);
    });
    it("adds visit info to the pouchDB record", async () => {
      when(mockPouchDB.get("fakeUID")).thenReturn({ body: {} });
      when(mockPouchDB.allDocs(anything())).thenReturn(EMPTY_POUCH_CONTENTS);

      uploader.save("fakeUID", FAKE_VISIT_CONTENTS, DocumentType.Visit, 0);

      await nextCall(mockPouchDB, "put", [anything()]);
      const newRecord = capture(mockPouchDB.put).last()[0] as any;
      expect(newRecord.body.documentType).toEqual(DocumentType.Visit);
      expect(newRecord.body.visit).toEqual(FAKE_VISIT_CONTENTS);
    });
    it("uploads a saved record to the api server", async () => {
      const contents = {
        total_rows: 1,
        rows: [
          {
            doc: FAKE_POUCH_DOC,
          },
        ],
      };
      when(mockPouchDB.allDocs()).thenReturn(contents);
      when(mockPouchDB.allDocs(anything())).thenReturn(contents);
      uploader.save("fakeUID", FAKE_VISIT_CONTENTS, DocumentType.Visit, 0);

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
      expect(postData).toEqual(FAKE_POUCH_DOC.body);
      expect(url).toMatch(new RegExp(`/documents/.*/${FAKE_CSRUID}`));
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
      const uploader = new DocumentUploader(db, Axios.create(), logger);
      const docB = await db.put({
        _id: "documents/1/1",
        body: { data: "b" },
      });
      const docA = await db.put({
        _id: "documents/0/2",
        body: { data: "a" },
      });
      const docC = await db.put({
        _id: "documents/2/3",
        body: { data: "c" },
      });

      let doc: any = await uploader["firstDocument"]();
      expect(doc!.body.data).toEqual("a");
      await db.remove(docA.id, docA.rev);
      doc = await uploader["firstDocument"]();
      expect(doc!.body.data).toEqual("b");
      await db.remove(docB.id, docB.rev);
      doc = await uploader["firstDocument"]();
      expect(doc!.body.data).toEqual("c");
      await db.remove(docC.id, docC.rev);
    });
  });
});
