// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { EncountersService } from "../services/encountersService";
import { 
  defaultNumEncounters,
  hutchConcurrentUploads
} from "../util/exportConfig";
import logger from "../util/logger";
import { GeocodingService } from "../services/geocodingService";
import { SmartyStreetsGeocoder } from "../external/smartyStreetsGeocoder";
import { CensusTractService } from "../services/censusTractService";
import { sequelizeNonPII } from "../models/index";
import {
  smartyStreetsAuthId,
  smartyStreetsAuthToken,
  smartyStreetsBaseUrl
} from "../util/geocodingConfig";
import * as SmartyStreetsSDK from "smartystreets-javascript-sdk";
import axios, { AxiosInstance } from "axios";
import { baseUrl } from "../util/hutchUploadConfig";
import { HutchUploader } from "../external/hutchUploader";
import { VisitsService } from "../services/visitsService";
import { HutchUpload } from "../models/hutchUpload";
import { user, password } from "../util/hutchUploadConfig";

const encountersService = createEncountersService();

/**
 * Gets completed vists that have not been exported and converts them to
 * Encounters.
 */
export async function getEncounters(req, res, next) {
  try {
    const service = await encountersService;
    const maxToRetrieve = +req.query.limit || defaultNumEncounters;
    const enc = await service.getEncounters(maxToRetrieve);
    res.json({ encounters: Array.from(enc.values()) });
  } catch (e) {
    next(e);
  }
}

/**
 * Pushes pending Encounters externally.
 */
export async function sendEncounters(req, res, next) {
  try {
    const service = await encountersService;
    const maxToSend = +req.query.limit || defaultNumEncounters;
    const result = await service.sendEncounters(maxToSend);
    res.json({ sent: result.sent, erred: result.erred });
  } catch (e) {
    next(e);
  }
}

async function createAxios(): Promise<AxiosInstance> {
  const api = axios.create({
    baseURL: await baseUrl
  });

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

async function createEncountersService(): Promise<EncountersService> {
  const geo = SmartyStreetsSDK.core;
  const credentials = new geo.StaticCredentials(
    await smartyStreetsAuthId,
    await smartyStreetsAuthToken
  );

  let geoClient;

  // Specifying base URL is leveraged in tests.
  if (
    smartyStreetsBaseUrl &&
    (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test")
  ) {
    geoClient = new geo.ClientBuilder(credentials)
      .withBaseUrl(smartyStreetsBaseUrl)
      .buildUsStreetApiClient();
  } else {
    geoClient = new geo.ClientBuilder(credentials).buildUsStreetApiClient();
  }

  const geocoder: GeocodingService = new GeocodingService(
    new SmartyStreetsGeocoder(geoClient),
    new CensusTractService(sequelizeNonPII)
  );

  const axiosClient = await createAxios();
  const uploader: HutchUploader = new HutchUploader(
    axiosClient,
    hutchConcurrentUploads,
    await user,
    await password,
    HutchUpload
  );

  const visits: VisitsService = new VisitsService();

  return new EncountersService(geocoder, uploader, visits);
}
