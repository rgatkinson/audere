// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { BigQueryTableImporter } from "../external/bigQuery";
import { FirebaseImport } from "../services/cough/firebaseImport";
import { LazyAsync } from "../util/lazyAsync";
import { SecretConfig } from "../util/secretsConfig";
import { SplitSql } from "../util/sql";
import { defineCoughModels } from "../models/db/cough";
import { getBigqueryConfig } from "../util/bigqueryConfig";
import { CoughDataPipeline } from "../services/cough/coughDataPipeline";
import { DataPipeline } from "../services/data/dataPipeline";
import { DataPipelineService } from "../services/data/dataPipelineService";
import logger from "../util/logger";

export class CoughFirebaseEndpoint {
  private firebaseImport: LazyAsync<FirebaseImport>;
  private pipeline: DataPipeline;
  private pipelineSvc: DataPipelineService;

  constructor(sql: SplitSql) {
    const secrets = new SecretConfig(sql);
    this.firebaseImport = new LazyAsync(async () => {
      const config = await getBigqueryConfig(secrets);
      const client = new BigQueryTableImporter(config);
      const models = defineCoughModels(sql);
      return new FirebaseImport(sql, models, client);
    });
    this.pipeline = new CoughDataPipeline(sql.nonPii);
    this.pipelineSvc = new DataPipelineService();
  }

  public importAnalytics = async (req, res, next) => {
    const svc = await this.firebaseImport.get();
    logger.info("Finding tables to update");
    const tableList = await svc.findTablesToUpdate();

    if (tableList.size > 0) {
      logger.info("Updating analytics tables");
      await svc.importAnalytics(tableList);
    } else {
      logger.warn("No tables found to update");
    }

    logger.info("Refreshing derived schema");
    await this.pipelineSvc.refresh(this.pipeline);
    logger.info("Refreshing complete");

    res.json({});
  };
}
