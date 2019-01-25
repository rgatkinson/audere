// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { LogLevel } from "audere-lib";
import PouchDB from "pouchdb-react-native";
import CryptoPouch from "crypto-pouch";
import axios from "axios";
import URL from "url-parse";
import uuidv4 from "uuid/v4";
import { Constants } from "expo";
import { DocumentType, VisitInfo } from "audere-lib";
import { AxiosInstance } from "axios";
import { getLogger } from "./LogUtil";
import { DocumentUploader } from "./DocumentUploader";

const IS_NODE_ENV_DEVELOPMENT = process.env.NODE_ENV === "development";
const logger = getLogger("api");

PouchDB.plugin(CryptoPouch);

export function createUploader(): TypedDocumentUploader {
  const api = createAxios();
  const db = new PouchDB("clientDB");
  return new TypedDocumentUploader(db, api);
}

class TypedDocumentUploader {
  private readonly uploader: DocumentUploader;
  private logId?: string;

  constructor(db: any, api: AxiosInstance) {
    this.uploader = new DocumentUploader(db, api);
  }

  public async documentsAwaitingUpload(): Promise<number | null> {
    return this.uploader.documentsAwaitingUpload();
  }
  public saveVisit(localUid: string, visit: VisitInfo) {
    this.uploader.save(localUid, visit, DocumentType.Visit, 1);
  }
  public saveFeedback(subject: string, body: string) {
    this.uploader.save(uuidv4(), { subject, body }, DocumentType.Feedback, 2);
  }
  public saveLog(logentry: string) {
    // TODO(ram): Batch these saves
    if (!this.logId) {
      this.logId = uuidv4();
    }
    this.uploader.save(
      this.logId,
      { logentry, level: LogLevel.Info },
      DocumentType.Log,
      3
    );
  }
  public saveCrashLog(logentry: string) {
    logger.info("Saving crash log");
    this.uploader.save(
      uuidv4(),
      { logentry, level: LogLevel.Fatal },
      DocumentType.Log,
      0
    );
  }
}

function createAxios() {
  const api = axios.create({
    baseURL: getApiBaseUrl(),
    xsrfCookieName: "csrftoken",
    xsrfHeaderName: "X-CSRFToken",
  });

  if (IS_NODE_ENV_DEVELOPMENT) {
    const REQUEST_FIELDS = ["method", "baseURL", "url", "data"];
    api.interceptors.request.use(request => {
      logger.debug(
        `HTTP request:\n${JSON.stringify(request, REQUEST_FIELDS, 2)}`
      );
      return request;
    });
    const RESPONSE_FIELDS = ["status", "headers", "data"];
    api.interceptors.response.use(response => {
      logger.debug(
        `HTTP response: "${JSON.stringify(response, RESPONSE_FIELDS, 2)}"`
      );
      return response;
    });
  }
  return api;
}

export function getApiBaseUrl(): string {
  let api: string;
  if (process.env.REACT_NATIVE_API_SERVER) {
    api = process.env.REACT_NATIVE_API_SERVER;
  } else if (
    IS_NODE_ENV_DEVELOPMENT &&
    process.env.REACT_NATIVE_USE_LOCAL_SERVER
  ) {
    api = `http://${new URL(Constants.manifest.bundleUrl).hostname}:3000/api`;
  } else {
    api = "https://api.staging.auderenow.io/api";
  }
  console.log(`API server: '${api}'`);
  return api;
}
