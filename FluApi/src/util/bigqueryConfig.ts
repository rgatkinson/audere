// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SecretConfig } from "./secretsConfig";

export interface BigqueryConfig {
  authToken: string;
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
  const [authToken] = await Promise.all([
    secrets.get("GCP_BIG_QUERY_FEVER")
  ]);
  return { authToken };
}
