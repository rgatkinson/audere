// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SecretConfig } from "./secretsConfig";

export interface BigqueryConfig {
  coughProject: string;
  coughDataset: string;
  coughEmail: string;
  coughKey: string;
}

let lazy: Promise<BigqueryConfig> | null = null;

export function getBigqueryConfig(
  secrets: SecretConfig
): Promise<BigqueryConfig> {
  if (lazy != null) {
    return lazy;
  }
  lazy = createConfig(secrets);
  return lazy;
}

async function createConfig(secrets: SecretConfig): Promise<BigqueryConfig> {
  const [coughProject, coughDataset, coughEmail, coughKey] = await Promise.all([
    secrets.get("GCP_PROJECT_COUGH"),
    secrets.get("GCP_FIREBASE_ANALYTICS_DATASET_COUGH"),
    secrets.get("GCP_BQ_CREDENTIALS_EMAIL_COUGH"),
    secrets.get("GCP_BQ_CREDENTIALS_KEY_COUGH")
  ]);
  return { coughProject, coughDataset, coughEmail, coughKey };
}
