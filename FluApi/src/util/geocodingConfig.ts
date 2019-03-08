// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SecretConfig } from "./secretsConfig";

export interface GeocodingConfig {
  baseUrl: string;
  authId: string;
  authToken: string;
  postgisUrl: string;
}

let lazy: Promise<GeocodingConfig> | null = null;

export function getGeocodingConfig(
  secrets: SecretConfig
): Promise<GeocodingConfig> {
  if (lazy != null) {
    return lazy;
  }
  lazy = createConfig(secrets);
  return lazy;
}

async function createConfig(secrets: SecretConfig): Promise<GeocodingConfig> {
  const baseUrl = process.env.SMARTYSTREETS_BASE_URL;
  const [authId, authToken, postgisUrl] = await Promise.all([
    secrets.get("SMARTYSTREETS_AUTH_ID"),
    secrets.get("SMARTYSTREETS_AUTH_TOKEN"),
    secrets.get("POSTGIS_DATABASE_URL")
  ]);
  return { baseUrl, authId, authToken, postgisUrl };
}
