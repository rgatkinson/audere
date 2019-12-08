// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { VirenaClient } from "../external/virenaClient";
import { ChillsVirenaService } from "../services/chills/chillsVirenaService";
import { LazyAsync } from "../util/lazyAsync";
import { SecretConfig } from "../util/secretsConfig";
import { SplitSql } from "../util/sql";
import { jsonKeepAlive } from "../util/expressApp";
import { getS3Config } from "../util/s3Config";
import { VirenaDataPipeline } from "../services/chills/virenaDataPipeline";
import { DataPipeline } from "../services/data/dataPipeline";
import { DataPipelineService } from "../services/data/dataPipelineService";
import AWS from "aws-sdk";
import logger from "../util/logger";

export class ChillsVirenaEndpoint {
  private readonly service: LazyAsync<ChillsVirenaService>;
  private pipeline: DataPipeline;

  private readonly SEGMENT_SIZE = 5000;

  constructor(sql: SplitSql) {
    const secrets = new SecretConfig(sql);
    this.service = new LazyAsync(async () => {
      const s3Config = await getS3Config(secrets);
      const s3 = new AWS.S3({ region: "us-west-2" });
      const client = new VirenaClient(s3, s3Config);
      return new ChillsVirenaService(sql, client, this.SEGMENT_SIZE);
    });

    this.pipeline = new VirenaDataPipeline(sql.nonPii);
  }

  public importVirenaData = async (req, res, next) => {
    const { progress, replyJson } = jsonKeepAlive(res);
    const pipelineSvc = new DataPipelineService(progress);

    const svc = await this.service.get();
    await svc.import(progress);

    logger.info("Refreshing derived schema");
    await pipelineSvc.refresh(this.pipeline);
    logger.info("Refresh complete");

    replyJson({});
  };
}
