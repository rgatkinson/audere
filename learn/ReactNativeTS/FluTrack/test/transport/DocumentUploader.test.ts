import Axios, { AxiosInstance, AxiosResponse } from "axios";
import PouchDB from "pouchdb-react-native";
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
import { DocumentUploader } from "../../src/transport";
import { PouchDoc } from "../../src/transport/Types";
import { axiosResponse, nextCall } from "../util";

const FAKE_VISIT_RECORD = {
  _id: "documents/fakeRecordId",
  body: { visit: "someFakeData" },
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

      uploader.save("fakeUID", FAKE_VISIT_RECORD);

      await nextCall(mockPouchDB, "put", [anything()]);
      const newRecord = capture(mockPouchDB.put).last()[0] as PouchDoc;
      expect(newRecord.body.visit).toEqual(FAKE_VISIT_RECORD);
    });
    it("uploads a saved record to the api server", async () => {
      const contents = {
        total_rows: 1,
        rows: [{ doc: JSON.parse(JSON.stringify(FAKE_VISIT_RECORD)) }],
      };
      when(mockPouchDB.allDocs()).thenReturn(contents);
      when(mockPouchDB.allDocs(anything())).thenReturn(contents);
      uploader.save("fakeUID", FAKE_VISIT_RECORD);

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
});
