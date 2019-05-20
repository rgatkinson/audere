// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import PouchDB from "pouchdb-react-native";
import CryptoPouch from "crypto-pouch";
import axios from "axios";
import URL from "url-parse";
import { Constants } from "expo";
import { DocumentType, SurveyInfo } from "audere-lib/coughProtocol";
import { DocumentUploader } from "./DocumentUploader";

const IS_NODE_ENV_DEVELOPMENT = process.env.NODE_ENV === "development";

PouchDB.plugin(CryptoPouch);

export function createTransport(): TypedDocumentUploader {
  const db = new PouchDB("clientDB", { auto_compaction: true });
  const api = createAxios();
  const uploader = new DocumentUploader(db, api);

  return new TypedDocumentUploader(uploader);
}

class TypedDocumentUploader {
  private readonly uploader: DocumentUploader;

  constructor(uploader: DocumentUploader) {
    this.uploader = uploader;
  }

  public async documentsAwaitingUpload(): Promise<number | null> {
    return this.uploader.documentsAwaitingUpload();
  }
  public saveSurvey(csruid: string, survey: SurveyInfo) {
    this.uploader.save(csruid, survey, DocumentType.Survey, 1);
  }
  public async savePhoto(csruid: string, jpegBase64: string) {
    const timestamp = new Date().toISOString();
    this.uploader.save(
      csruid,
      { timestamp, jpegBase64: "" },
      DocumentType.Photo,
      1,
      { jpegBase64 }
    );
  }

  public async getEncryptionPassword(): Promise<string> {
    return await this.uploader.getEncryptionPassword();
  }
}

function createAxios() {
  const api = axios.create({
    baseURL: getApiBaseUrl(),
    xsrfCookieName: "csrftoken",
    xsrfHeaderName: "X-CSRFToken",
  });
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
