// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import * as AWS from "aws-sdk";
import { CoughFollowUpClient } from "../external/coughFollowUpClient";
import { CoughDataPipeline } from "../services/cough/coughDataPipeline";
import { DataPipeline } from "../services/data/dataPipeline";
import { DataPipelineService } from "../services/data/dataPipelineService";
import { defineCoughModels } from "../models/db/cough";
import { getS3Config } from "../util/s3Config";
import { LazyAsync } from "../util/lazyAsync";
import { QualtricsImport } from "../services/cough/qualtricsImport";
import { SecretConfig } from "../util/secretsConfig";
import { SplitSql } from "../util/sql";
import logger from "../util/logger";

export class CoughFollowUpEndpoint {
  private qualtricsImport: LazyAsync<QualtricsImport>;
  private pipeline: DataPipeline;
  private pipelineSvc: DataPipelineService;

  constructor(sql: SplitSql) {
    const secrets = new SecretConfig(sql);
    const models = defineCoughModels(sql);
    this.qualtricsImport = new LazyAsync(async () => {
      const s3Config = await getS3Config(secrets);
      const s3 = new AWS.S3({ region: "us-west-2" });
      const client = new CoughFollowUpClient(s3, s3Config);
      return new QualtricsImport(models, client, sql);
    });
    this.pipeline = new CoughDataPipeline(sql.nonPii);
    this.pipelineSvc = new DataPipelineService();
  }

  public importFollowUps = async (req, res, next) => {
    const svc = await this.qualtricsImport.get();
    logger.info("Finding Qualtrics surveys to import");
    await svc.importFollowUpSurveys();

    logger.info("Refreshing derived schema");
    await this.pipelineSvc.refresh(this.pipeline);
    logger.info("Refreshing complete");

    res.json({});
  };
}
