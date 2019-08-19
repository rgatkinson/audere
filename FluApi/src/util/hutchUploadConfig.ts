// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SecretConfig } from "backend-lib";

export interface HutchConfig {
  baseUrl: string;
  user: string;
  password: string;
}

let lazy: Promise<HutchConfig> | null = null;

export function getHutchConfig(secrets: SecretConfig): Promise<HutchConfig> {
  if (lazy != null) {
    return lazy;
  }
  lazy = createConfig(secrets);
  return lazy;
}

async function createConfig(secrets: SecretConfig): Promise<HutchConfig> {
  const [baseUrl, user, password] = await Promise.all([
    secrets.get("HUTCH_BASE_URL"),
    secrets.get("HUTCH_USER"),
    secrets.get("HUTCH_PASSWORD"),
  ]);
  return { baseUrl, user, password };
}
