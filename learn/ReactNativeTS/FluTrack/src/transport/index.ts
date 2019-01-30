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
import { DocumentUploader } from "./DocumentUploader";
import { LazyUploader, LogBatcher } from "./LogBatcher";

const IS_NODE_ENV_DEVELOPMENT = process.env.NODE_ENV === "development";

PouchDB.plugin(CryptoPouch);

interface Transport {
  uploader: TypedDocumentUploader;
  logger: LogBatcher;
}

export function createTransport(): Transport {
  const db = new PouchDB("clientDB", { auto_compaction: true });
  const lazyUploader = new LazyUploader();
  const logger = new LogBatcher(lazyUploader, 3, <any>db);
  const api = createAxios(logger);
  const uploader = new DocumentUploader(db, api, logger);

  lazyUploader.bind(uploader);

  return {
    uploader: new TypedDocumentUploader(uploader),
    logger,
  };
}

class TypedDocumentUploader {
  private readonly uploader: DocumentUploader;

  constructor(uploader: DocumentUploader) {
    this.uploader = uploader;
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

  public saveCrashLog(logentry: string) {
    this.uploader.save(
      uuidv4(),
      { logentry, level: LogLevel.Fatal },
      DocumentType.Log,
      0
    );
  }
}

function createAxios(logger: LogBatcher) {
  const api = axios.create({
    baseURL: getApiBaseUrl(),
    xsrfCookieName: "csrftoken",
    xsrfHeaderName: "X-CSRFToken",
  });

  if (IS_NODE_ENV_DEVELOPMENT) {
    const REQUEST_FIELDS = ["method", "baseURL", "url"];
    api.interceptors.request.use(request => {
      logger.info(
        `HTTP request:\n${JSON.stringify(request, REQUEST_FIELDS, 2)}`
      );
      return request;
    });
    const RESPONSE_FIELDS = ["status", "headers"];
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
    api = `http://${new URL(Constants.linkingUri).hostname}:3000/api`;
  } else {
    api = "https://api.staging.auderenow.io/api";
  }
  console.log(`API server: '${api}'`);
  return api;
}
