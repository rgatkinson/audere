// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { EncountersService } from "../services/encountersService";
import { hutchConcurrentUploads, getHashSecret } from "../util/exportConfig";
import { HutchUploader } from "../external/hutchUploader";
import { EncounterDetailsService } from "../services/encounterDetailsService";
import { defineHutchUpload } from "../models/db/hutchUpload";
import { getHutchConfig } from "../util/hutchUploadConfig";
import { defineFeverModels } from "../models/db/fever";
import { defineSnifflesModels } from "../models/db/sniffles";
import { createAxios } from "../util/axios";
import { SplitSql } from "../util/sql";
import { SecretConfig } from "../util/secretsConfig";
import { createGeocoder } from "../util/geocoder";

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
      const enc = await service.getEncounters();
      res.json({ encounters: enc.map(e => e.encounter) });
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
      const result = await service.sendEncounters();
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }
}

async function createEncountersService(
  sql: SplitSql
): Promise<EncountersService> {
  const secrets = new SecretConfig(sql);
  const geocoder = await createGeocoder(secrets, sql);
  const hutchUploadModel = defineHutchUpload(sql);
  const hutchConfig = await getHutchConfig(secrets);
  const axiosClient = await createAxios(hutchConfig.baseUrl);
  const uploader: HutchUploader = new HutchUploader(
    axiosClient,
    hutchConcurrentUploads,
    hutchConfig.user,
    hutchConfig.password
  );

  const encounterDetails: EncounterDetailsService = new EncounterDetailsService(
    defineFeverModels(sql),
    defineSnifflesModels(sql),
    hutchUploadModel
  );

  const hashSecret = await getHashSecret(secrets);

  return new EncountersService(
    geocoder,
    uploader,
    encounterDetails,
    hashSecret
  );
}
