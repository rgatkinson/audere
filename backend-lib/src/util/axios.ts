// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import axios, { AxiosInstance } from "axios";
import { Logger } from "winston";

export function createAxios(baseURL: string, logger: Logger): AxiosInstance {
  const api = axios.create({ baseURL });

  if (process.env.NODE_ENV === "development") {
    // TODO: "data" field doesn't log anything
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
