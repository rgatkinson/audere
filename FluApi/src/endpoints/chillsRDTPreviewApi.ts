// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { ChillsRDTPreview } from "../services/chills/chillsRDTPreviewService";
import { ChillsRDTPreviewClient } from "../external/chillsRDTPreviewClient";
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
    this.client = new ChillsRDTPreviewClient(sql);
    this.pipeline = new ChillsDataPipeline(sql.nonPii);
    this.service = new ChillsRDTPreview(sql);
  }

  public importRDTPreview = async (req, res, next) => {
    const { progress, replyJson } = jsonKeepAlive(res);
    const pipelineSvc = new DataPipelineService(progress);

    logger.info("Finding RDT preview series for import");

    const photos = await this.client.getRDTPreviewPhotos();
    logger.info(`${photos.length} rdt preview frames found for import`);

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const data = await this.client.getRDTPreviewData(photo);
      await this.service.importRDTPreviews(data);
      logger.info(`Updated rdt preview series data`);
    }

    // refresh pipeline
    logger.info("Refreshing derived schema");
    await pipelineSvc.refresh(this.pipeline);
    logger.info("Refresh of derived schema complete");

    replyJson({});
  };
}
