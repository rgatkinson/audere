// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { EncountersService } from "../../services/encountersService";
import {
  defaultNumEncounters,
  hutchConcurrentUploads,
  getHashSecret
} from "../../util/exportConfig";
import logger from "../../util/logger";
import axios, { AxiosInstance } from "axios";
import { HutchUploader } from "../../external/hutchUploader";
import { VisitsService } from "../../services/visitsService";
import { defineHutchUpload } from "../../models/hutchUpload";
import { getHutchConfig } from "../../util/hutchUploadConfig";
import { defineSnifflesModels } from "../../models/sniffles";
import { SplitSql } from "../../util/sql";
import { SecretConfig } from "../../util/secretsConfig";
import { createGeocoder } from "../../util/geocoder";

export class HutchUploaderEndpoint {
  private readonly sql: SplitSql;
  private encountersServicePromise: Promise<EncountersService> | null;

  constructor(sql: SplitSql) {
    this.sql = sql;
    this.encountersServicePromise = null;
  }

  private lazyEncountersService(): Promise<EncountersService> {
    const existing = this.encountersServicePromise;
    if (existing != null) {
      return existing;
    }

    const created = createEncountersService(this.sql);
    this.encountersServicePromise = created;
    return created;
  }

  /**
   * Gets completed vists that have not been exported and converts them to
   * Encounters.
   */
  public async getEncounters(req, res, next) {
    try {
      const service = await this.lazyEncountersService();
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
  public async sendEncounters(req, res, next) {
    try {
      const service = await this.lazyEncountersService();
      const maxToSend = +req.query.limit || defaultNumEncounters;
      const result = await service.sendEncounters(maxToSend);
      res.json({ sent: result.sent, erred: result.erred });
    } catch (e) {
      next(e);
    }
  }
}

function createAxios(baseURL): AxiosInstance {
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

async function createEncountersService(
  sql: SplitSql
): Promise<EncountersService> {
  const geocoder = await createGeocoder(sql);

  const secrets = new SecretConfig(sql);
  const hutchUploadModel = defineHutchUpload(sql);
  const hutchConfig = await getHutchConfig(secrets);
  const axiosClient = await createAxios(hutchConfig.baseUrl);
  const uploader: HutchUploader = new HutchUploader(
    axiosClient,
    hutchConcurrentUploads,
    hutchConfig.user,
    hutchConfig.password,
    hutchUploadModel
  );

  const visits: VisitsService = new VisitsService(
    defineSnifflesModels(sql),
    hutchUploadModel
  );

  const hashSecret = await getHashSecret(secrets);

  return new EncountersService(geocoder, uploader, visits, hashSecret);
}
