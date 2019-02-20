// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import PouchDB from "pouchdb-react-native";
import CryptoPouch from "crypto-pouch";
import axios from "axios";
import URL from "url-parse";
import uuidv4 from "uuid/v4";
import { Constants } from "expo";
import { DocumentType, SurveyInfo } from "audere-lib/feverProtocol";
import { DocumentUploader } from "./DocumentUploader";
import { LazyUploader, AnalyticsBatcher } from "./AnalyticsBatcher";
import { EventTracker } from "./EventUtil";

const IS_NODE_ENV_DEVELOPMENT = process.env.NODE_ENV === "development";

PouchDB.plugin(CryptoPouch);

interface Transport {
  uploader: TypedDocumentUploader;
  logger: AnalyticsBatcher;
  events: EventTracker;
}

export function createTransport(): Transport {
  const db = new PouchDB("clientDB", { auto_compaction: true });
  const lazyUploader = new LazyUploader();
  const batcher = new AnalyticsBatcher(lazyUploader, <any>db, { uploadPriority: 3 });
  const api = createAxios(batcher);
  const uploader = new DocumentUploader(db, api, batcher);

  lazyUploader.bind(uploader);

  return {
    uploader: new TypedDocumentUploader(uploader, batcher),
    logger: batcher,
    events: batcher,
  };
}

class TypedDocumentUploader {
  private readonly uploader: DocumentUploader;
  private readonly batcher: AnalyticsBatcher;

  constructor(uploader: DocumentUploader, batcher: AnalyticsBatcher) {
    this.uploader = uploader;
    this.batcher = batcher;
  }

  public async documentsAwaitingUpload(): Promise<number | null> {
    return this.uploader.documentsAwaitingUpload();
  }
  public saveSurvey(localUid: string, survey: SurveyInfo) {
    this.uploader.save(localUid, survey, DocumentType.Survey, 1);
  }
  public saveFeedback(subject: string, body: string) {
    this.uploader.save(uuidv4(), { subject, body }, DocumentType.Feedback, 2);
  }
  public saveCrashLog(logentry: string) {
    this.batcher.fatal(logentry);
  }
  public async getEncryptionPassword(): Promise<string> {
    return await this.uploader.getEncryptionPassword();
  }
}

function createAxios(logger: AnalyticsBatcher) {
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
