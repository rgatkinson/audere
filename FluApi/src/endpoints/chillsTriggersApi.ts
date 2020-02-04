// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { ChillsTriggers } from "../services/chills/chillsTriggersService";
import { EvidationTriggersClient } from "../external/evidationTriggersClient";
import {
  getGoogleApisConfig,
  ChillsGoogleApisConfig,
} from "../util/chillsGoogleApisConfig";
import { LazyAsync } from "../util/lazyAsync";
import { SecretConfig } from "../util/secretsConfig";
import { SplitSql } from "../util/sql";
import { jsonKeepAlive } from "../util/expressApp";
import { ChillsDataPipeline } from "../services/chills/chillsDataPipeline";
import { DataPipelineService } from "../services/data/dataPipelineService";
import { google, sheets_v4 } from "googleapis";
import logger from "../util/logger";

export class ChillsTriggersEndpoint {
  private readonly config: LazyAsync<ChillsGoogleApisConfig>;
  private readonly googleClient: LazyAsync<EvidationTriggersClient>;
  private readonly pipeline: ChillsDataPipeline;
  private readonly service: ChillsTriggers;

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

      return new EvidationTriggersClient(api);
    });

    this.pipeline = new ChillsDataPipeline(sql.nonPii);
    this.service = new ChillsTriggers(sql);
  }

  public importTriggers = async (req, res, next) => {
    const { progress, replyJson } = jsonKeepAlive(res);
    const pipelineSvc = new DataPipelineService(progress);

    const apiConfig = await this.config.get();
    const client = await this.googleClient.get();

    logger.info("Finding Chills triggers for import");

    const triggers = await client.getSheetData(apiConfig.triggersSpreadsheetId);
    logger.info(`${triggers.length} triggers found for import`);

    await this.service.importTriggers(triggers);
    logger.info(`Updated Evidation shipped triggers`);

    // refresh pipeline
    logger.info("Refreshing derived schema");
    await pipelineSvc.refresh(this.pipeline);
    logger.info("Refresh of derived schema complete");

    replyJson({});
  };
}
