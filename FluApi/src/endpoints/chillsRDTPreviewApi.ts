// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { ChillsRDTPreview } from "../services/chills/chillsRDTPreviewService";
import { ChillsRDTPreviewClient } from "../external/chillsRDTPreviewClient";
import { LazyAsync } from "../util/lazyAsync";
import { SecretConfig } from "../util/secretsConfig";
import { SplitSql } from "../util/sql";
import { jsonKeepAlive } from "../util/expressApp";
import { ChillsDataPipeline } from "../services/chills/chillsDataPipeline";
import { DataPipelineService } from "../services/data/dataPipelineService";
import logger from "../util/logger";

export class ChillsRDTPreviewEndpoint {
  private readonly client: ChillsRDTPreviewClient;
  private readonly pipeline: ChillsDataPipeline;
  private readonly service: ChillsRDTPreview;

  constructor(sql: SplitSql) {
    const secrets = new SecretConfig(sql);
    this.client = new ChillsRDTPreviewClient(sql);
    this.pipeline = new ChillsDataPipeline(sql.nonPii);
    this.service = new ChillsRDTPreview(sql);
  }

  public importRDTPreview = async (req, res, next) => {
    const { progress, replyJson } = jsonKeepAlive(res);
    const pipelineSvc = new DataPipelineService(progress);

    logger.info("Finding RDT preview series for import");

    const rdt_previews = await this.client.getRDTPreviewData();
    logger.info(`${rdt_previews.length} rdt preview frames found for import`);

    await this.service.importRDTPreviews(rdt_previews);
    logger.info(`Updated rdt preview series data`);

    // refresh pipeline
    logger.info("Refreshing derived schema");
    await pipelineSvc.refresh(this.pipeline);
    logger.info("Refresh of derived schema complete");

    replyJson({});
  };
}
