// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { AsprenClient } from "../external/asprenClient";
import { AsprenImport } from "../services/cough/asprenImport";
import { LazyAsync } from "../util/lazyAsync";
import { SecretConfig, SplitSql } from "backend-lib";
import { getS3Config } from "../util/s3Config";
import { DataPipelineService } from "../services/dataPipelineService";
import AWS from "aws-sdk";
import logger from "../util/logger";

/**
 * Imports ASPREN data into the Cough ecosystem.
 */
export class CoughAsprenEndpoint {
  private readonly service: LazyAsync<AsprenImport>;
  private pipeline: DataPipelineService;

  constructor(sql: SplitSql) {
    const secrets = new SecretConfig(sql);
    this.service = new LazyAsync(async () => {
      const s3Config = await getS3Config(secrets);
      const s3 = new AWS.S3({ region: "us-west-2" });
      const client = new AsprenClient(s3, s3Config);
      return new AsprenImport(sql, client);
    });
    this.pipeline = new DataPipelineService(sql);
  }

  public importAsprenReports = async (req, res, next) => {
    const svc = await this.service.get();
    await svc.importAsprenReports();

    logger.info("Refreshing derived schema");
    await this.pipeline.refresh();
    logger.info("Refresh complete");

    res.json({});
  };
}
