// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { EvidationMTLClient } from "../external/evidationMTLClient";
import { ChillsMTLService } from "../services/chills/chillsMTLService";
import { DataPipeline } from "../services/data/dataPipeline";
import { DataPipelineService } from "../services/data/dataPipelineService";
import { ChillsDataPipeline } from "../services/chills/chillsDataPipeline";
import { LazyAsync } from "../util/lazyAsync";
import { SecretConfig } from "../util/secretsConfig";
import { SplitSql } from "../util/sql";
import { getS3Config } from "../util/s3Config";
import AWS from "aws-sdk";
import logger from "../util/logger";

/**
 * Endpoint for loading order status and lab data from Evidation.
 */
export class ChillsMTLEndpoint {
  private readonly service: LazyAsync<ChillsMTLService>;
  private pipeline: DataPipeline;

  constructor(sql: SplitSql) {
    const secrets = new SecretConfig(sql);
    this.service = new LazyAsync(async () => {
      const s3Config = await getS3Config(secrets);
      const s3 = new AWS.S3({ region: "us-west-2" });
      const client = new EvidationMTLClient(s3, s3Config);
      return new ChillsMTLService(sql, client);
    });

    this.pipeline = new ChillsDataPipeline(sql.nonPii);
  }

  public import = async (req, res, next) => {
    const svc = await this.service.get();
    logger.info("Finding MTL reports to import");
    await svc.import();

    const pipelineSvc = new DataPipelineService();
    logger.info("Refreshing derived schema");
    pipelineSvc.refresh(this.pipeline);
    logger.info("Refresh complete");

    res.json({});
  };
}
