// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SecretConfig } from "./secretsConfig";

export interface BigQueryConfig {
  project: string;
  dataset: string;
  email: string;
  key: string;
}

export interface BQProjectConfig {
  chills: BigQueryConfig;
  cough: BigQueryConfig;
}

let lazy: Promise<BQProjectConfig> | null = null;

export function getBigqueryConfig(
  secrets: SecretConfig
): Promise<BQProjectConfig> {
  if (lazy != null) {
    return lazy;
  }
  lazy = createConfig(secrets);
  return lazy;
}

async function createConfig(secrets: SecretConfig): Promise<BQProjectConfig> {
  const [
    coughProject,
    coughDataset,
    coughEmail,
    coughKey,
    chillsProject,
    chillsDataset,
    chillsEmail,
    chillsKey,
  ] = await Promise.all([
    secrets.get("GCP_PROJECT_COUGH"),
    secrets.get("GCP_FIREBASE_ANALYTICS_DATASET_COUGH"),
    secrets.get("GCP_BQ_CREDENTIALS_EMAIL_COUGH"),
    secrets.get("GCP_BQ_CREDENTIALS_KEY_COUGH"),
    secrets.get("GCP_PROJECT_CHILLS"),
    secrets.get("GCP_FIREBASE_ANALYTICS_DATASET_CHILLS"),
    secrets.get("GCP_BQ_CREDENTIALS_EMAIL_CHILLS"),
    secrets.get("GCP_BQ_CREDENTIALS_KEY_CHILLS"),
  ]);
  return {
    chills: {
      project: chillsProject,
      dataset: chillsDataset,
      email: chillsEmail,
      key: chillsKey,
    },
    cough: {
      project: coughProject,
      dataset: coughDataset,
      email: coughEmail,
      key: coughKey,
    },
  };
}
