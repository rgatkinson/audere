// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import PouchDB from "pouchdb-react-native";
import axios from "axios";
import URL from "url-parse";
import uuidv4 from "uuid/v4";
import { Constants } from "expo";
import { DocumentType } from "audere-lib";
import { AxiosInstance } from "axios";
import { getLogger } from "./LogUtil";
import { UploadDoc } from "./Types";
import { DocumentUploader } from "./DocumentUploader";

const IS_NODE_ENV_DEVELOPMENT = process.env.NODE_ENV === "development";
const logger = getLogger("api");

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

  public saveVisit(localUid: string, visit: UploadDoc) {
    this.uploader.save(localUid, visit, DocumentType.Visit, 0);
  }
  public saveFeedback(feedback: string) {
    this.uploader.save(uuidv4(), { feedback }, DocumentType.Feedback, 1);
  }
  public saveLog(log: string) {
    // TODO(ram): Batch these saves
    if (!this.logId) {
      this.logId = uuidv4();
    }
    this.uploader.save(this.logId, { log }, DocumentType.Log, 2);
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

function getApiBaseUrl(): string {
  let api: string;
  if (process.env.REACT_NATIVE_API_SERVER) {
    api = process.env.REACT_NATIVE_API_SERVER;
  } else if (
    IS_NODE_ENV_DEVELOPMENT &&
    process.env.REACT_NATIVE_USE_LOCAL_SERVER
  ) {
    api = `http://${new URL(Constants.linkingUri).hostname}:3000/api`;
  } else {
    api = "https://api.staging.auderenow.io";
  }
  console.log(`API server: '${api}'`);
  return api;
}
