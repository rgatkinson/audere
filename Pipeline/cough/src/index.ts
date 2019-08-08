// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import yargs from "yargs";
import { DerivedTask } from "./tasks/derived";
import { createSql } from "./core/sql/sql";
import { FirebaseImport } from "./core/firebase/firebaseImport";
import {
  defineFirebaseAnalayticsTable,
  defineFirebaseAnalytics,
} from "./core/firebase/models";
import { BigQueryTableImporter } from "./core/firebase/bigQuery";
import { SecretConfig } from "./core/secretsConfig";
import logger from "./core/logger";

const sql = createSql();

yargs
  .command({
    command: "analytics",
    handler: command(analytics),
  })
  .command({
    command: "refresh",
    handler: command(refresh),
  }).argv;

function command(cmd: any) {
  return async (argv: any) => {
    try {
      await cmd(argv);
    } catch (err) {
      if (err.checked) {
        logger.error(`Error: ${err.message}`);
      } else {
        throw err;
      }
    } finally {
      await sql.close();
      logger.close();
    }
  };
}

async function analytics() {
  logger.info("Attempting to ingest Firebase analytics");
  const models = {
    analytics: defineFirebaseAnalytics(sql),
    analyticsTables: defineFirebaseAnalayticsTable(sql),
  };

  const secrets = new SecretConfig(sql);
  const project = await secrets.get("GCP_PROJECT_COUGH");
  const dataset = await secrets.get("GCP_FIREBASE_ANALYTICS_DATASET_COUGH");
  const email = await secrets.get("GCP_BQ_CREDENTIALS_EMAIL_COUGH");
  const key = await secrets.get("GCP_BQ_CREDENTIALS_KEY_COUGH");
  const importer = new BigQueryTableImporter(project, dataset, email, key);

  const task = new FirebaseImport(sql, models, importer);

  logger.info("Finding tables to update");
  const tableList = await task.findTablesToUpdate();

  if (tableList.size > 0) {
    logger.info("Updating analytics tables");
    await task.importAnalytics(tableList);
  } else {
    logger.warn("No tables found to update");
  }
}

async function refresh() {
  logger.info("Refreshing derived schema");
  const task = new DerivedTask(sql);
  await task.refresh();
}
