// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { ChillsKits } from "../services/chills/chillsKitsService";
import { EvidationKitClient } from "../external/evidationKitClient";
import {
  getGoogleApisConfig,
  ChillsGoogleApisConfig,
} from "../util/chillsGoogleApisConfig";
import { LazyAsync } from "../util/lazyAsync";
import { SecretConfig } from "../util/secretsConfig";
import { SplitSql } from "../util/sql";
import { ChillsDataPipeline } from "../services/chills/chillsDataPipeline";
import { DataPipelineService } from "../services/data/dataPipelineService";
import { google, sheets_v4 } from "googleapis";
import logger from "../util/logger";

export class ChillsImportKits {
  private readonly config: LazyAsync<ChillsGoogleApisConfig>;
  private readonly googleClient: LazyAsync<EvidationKitClient>;
  private readonly pipeline: ChillsDataPipeline;
  private readonly pipelineSvc: DataPipelineService;
  private readonly service: ChillsKits;

  constructor(sql: SplitSql) {
    const secrets = new SecretConfig(sql);
    this.config = new LazyAsync(async () => getGoogleApisConfig(secrets));

    this.googleClient = new LazyAsync(async () => {
      const apiConfig = await this.config.get();
      const client = new google.auth.OAuth2({
        clientId: apiConfig.clientId,
        clientSecret: apiConfig.clientSecret,
        redirectUri: "https://localhost.com",
      });

      client.setCredentials({
        refresh_token: apiConfig.refreshToken,
      });

      const api = new sheets_v4.Sheets({
        auth: client,
      });

      return new EvidationKitClient(api);
    });

    this.pipeline = new ChillsDataPipeline(sql.nonPii);
    this.pipelineSvc = new DataPipelineService();
    this.service = new ChillsKits(sql);
  }

  public importKits = async (req, res, next) => {
    const apiConfig = await this.config.get();
    const client = await this.googleClient.get();

    logger.info("Finding Chills kit orders for import");

    const kits = await client.getSheetData(apiConfig.spreadsheetId);
    logger.info(`${kits.length} kits found for import`);

    const demoKits = await client.getSheetData(apiConfig.demoSpreadsheetId);
    logger.info(`${demoKits.length} demo kits found for import`);

    await this.service.importKits(kits, demoKits);
    logger.info(`Updated Evidation shipped kits`);

    // refresh pipeline
    logger.info("Refreshing derived schema");
    await this.pipelineSvc.refresh(this.pipeline);
    logger.info("Refresh of derived schema complete");

    res.sendStatus(200);
  };
}
