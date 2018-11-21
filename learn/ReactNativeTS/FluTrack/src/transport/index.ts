// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import PouchDB from "pouchdb-react-native";
import axios from "axios";
import URL from "url-parse";
import { Constants } from "expo";
import { getLogger } from "./LogUtil";
import { DocumentUploader } from "./DocumentUploader";

export { DocumentUploader } from "./DocumentUploader";

const IS_NODE_ENV_DEVELOPMENT = process.env.NODE_ENV === "development";
const logger = getLogger("api");

export function createUploader(): DocumentUploader {
  const api = createAxios();
  const db = new PouchDB("clientDB");
  // if (IS_NODE_ENV_DEVELOPMENT) {
  //   PouchDB.debug.enable("*");
  // }
  return new DocumentUploader(db, api);
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
