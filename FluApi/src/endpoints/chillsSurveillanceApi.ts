// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { ChillsSurveillanceService } from "../services/chills/chillsSurveillanceService";
import { DataPipelineService } from "../services/data/dataPipelineService";
import { DataPipeline } from "../services/data/dataPipeline";
import { jsonKeepAlive } from "../util/expressApp";
import { VirenaDataPipeline } from "../services/chills/virenaDataPipeline";
import { LazyAsync } from "../util/lazyAsync";
import { SplitSql } from "../util/sql";
import logger from "../util/logger";

export class ChillsSurveillanceEndpoint {
  private readonly service: LazyAsync<ChillsSurveillanceService>;
  private pipeline: DataPipeline;

  constructor(sql: SplitSql) {
    this.service = new LazyAsync(async () => {
      return new ChillsSurveillanceService(sql);
    });

    this.pipeline = new VirenaDataPipeline(sql.nonPii);
  }

  public import = async (req, res, next) => {
    const { progress, replyJson } = jsonKeepAlive(res);
    const pipelineSvc = new DataPipelineService(progress);

    const svc = await this.service.get();
    logger.info("Finding CDC reports to import");
    await svc.import(progress);

    logger.info("Refreshing derived schema");
    await pipelineSvc.refresh(this.pipeline);
    logger.info("Refresh complete");

    replyJson({});
  };
}
