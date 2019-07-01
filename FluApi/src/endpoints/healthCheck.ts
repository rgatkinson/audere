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

export class ServerHealth {
  private sql: SplitSql;

  constructor(sql: SplitSql) {
    this.sql = sql;
  }

  public async test(req, res) {
    let secrets = new SecretConfig(this.sql);
    try {
      const allSecrets = await Promise.all([
        secrets.get("HUTCH_BASE_URL"),
        secrets.get("HUTCH_USER"),
        secrets.get("HUTCH_PASSWORD"),
        secrets.get("GCP_BIG_QUERY_FEVER"),
        secrets.get("EXPORT_HASH_SECRET"),
        secrets.get("SMARTYSTREETS_AUTH_ID"),
        secrets.get("SMARTYSTREETS_AUTH_TOKEN"),
        secrets.get("POSTGIS_DATABASE_URL"),
        secrets.get("REDCAP_KIT_PROCESSING_TOKEN"),
        secrets.get("REDCAP_FOLLOW_UPS_TOKEN"),
        secrets.get("REDCAP_API_URL"),
        secrets.get("REDCAP_HOME_DATA_REPORT_ID"),
        secrets.get("REDCAP_SURVEY_DATA_REPORT_ID"),
        secrets.get("S3_REPORT_BUCKET"),
        secrets.get("SHAREPOINT_URL"),
        secrets.get("SHAREPOINT_CLIENT_ID"),
        secrets.get("SHAREPOINT_CLIENT_SECRET"),
        secrets.get("SHAREPOINT_INCENTIVES_FOLDER"),
        secrets.get("SHAREPOINT_KITS_FOLDER")
      ]);
      const connector = connectorFromSqlSecrets(this.sql);
      const collection = getPhotoCollection();
      const receiver = new FirebaseReceiver(connector, { collection });
      await receiver.healthCheck();
      res.json({ Status: "Good" });
    } catch {
      res.json({ Status: "Something went wrong" });
      res.status(500).end();
    }
  }
}

const DEFAULT_PHOTO_COLLECTION = "photos";

function getPhotoCollection() {
  return process.env.FIRESTORE_PHOTO_COLLECTION || DEFAULT_PHOTO_COLLECTION;
}
