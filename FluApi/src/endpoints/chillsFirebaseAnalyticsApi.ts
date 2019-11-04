// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { BigQueryTableImporter } from "../external/bigQuery";
import { FirebaseAnalyticsImport } from "../services/firebaseAnalyticsImport";
import { LazyAsync } from "../util/lazyAsync";
import { SecretConfig } from "../util/secretsConfig";
import { SplitSql } from "../util/sql";
import { defineChillsModels } from "../models/db/chills";
import { getBigqueryConfig } from "../util/bigqueryConfig";
import { ChillsDataPipeline } from "../services/chills/chillsDataPipeline";
import { DataPipeline } from "../services/data/dataPipeline";
import { DataPipelineService } from "../services/data/dataPipelineService";
import logger from "../util/logger";

export class ChillsFirebaseAnalyticsEndpoint {
  private firebaseImport: LazyAsync<FirebaseAnalyticsImport>;
  private pipeline: DataPipeline;
  private pipelineSvc: DataPipelineService;

  constructor(sql: SplitSql) {
    const secrets = new SecretConfig(sql);
    this.firebaseImport = new LazyAsync(async () => {
      const config = await getBigqueryConfig(secrets);
      const client = new BigQueryTableImporter(config);
      const models = defineChillsModels(sql);
      const importer = new FirebaseAnalyticsImport(
        sql,
        models.firebaseAnalytics,
        models.firebaseAnalyticsTable,
        client
      );
      return importer;
    });
    this.pipeline = new ChillsDataPipeline(sql.nonPii);
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
