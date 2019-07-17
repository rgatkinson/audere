// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SecretConfig } from "../util/secretsConfig";
import { SplitSql } from "../util/sql";
import {
  connectorFromSqlSecrets,
  FirebaseReceiver
} from "../external/firebase";
import { getPhotoCollection } from "./coughApi";
import logger from "../util/logger";

export class ServerHealth {
  private sql: SplitSql;

  constructor(sql: SplitSql) {
    this.sql = sql;
  }

  public async check(req, res) {
    let secrets = new SecretConfig(this.sql);
    try {
      const SECRET_KEYS = [
        "HUTCH_BASE_URL",
        "HUTCH_USER",
        "HUTCH_PASSWORD",
        "GCP_BIG_QUERY_FEVER",
        "GCP_FIREBASE_ANALYTICS_DATASET_COUGH",
        "GCP_BQ_CREDENTIALS_EMAIL_COUGH",
        "GCP_BQ_CREDENTIALS_KEY_COUGH",
        "EXPORT_HASH_SECRET",
        "SMARTYSTREETS_AUTH_ID",
        "SMARTYSTREETS_AUTH_TOKEN",
        "POSTGIS_DATABASE_URL",
        "REDCAP_KIT_PROCESSING_TOKEN",
        "REDCAP_FOLLOW_UPS_TOKEN",
        "REDCAP_API_URL",
        "REDCAP_HOME_DATA_REPORT_ID",
        "REDCAP_SURVEY_DATA_REPORT_ID",
        "S3_REPORT_BUCKET",
        "SHAREPOINT_URL",
        "SHAREPOINT_CLIENT_ID",
        "SHAREPOINT_CLIENT_SECRET",
        "SHAREPOINT_INCENTIVES_FOLDER",
        "SHAREPOINT_KITS_FOLDER"
      ];
      await Promise.all(SECRET_KEYS.map(key => secrets.get(key)));
      const connector = connectorFromSqlSecrets(this.sql);
      const collection = getPhotoCollection();
      const receiver = new FirebaseReceiver(connector, { collection });
      await receiver.healthCheck();
      res.json({ Status: "OK" });
    } catch (err) {
      logger.error(err);
      res.status(500).end();
    }
  }
}
