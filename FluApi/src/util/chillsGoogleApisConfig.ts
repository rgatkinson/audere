// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SecretConfig } from "./secretsConfig";

export interface ChillsGoogleApisConfig {
  refreshToken: string;
  spreadsheetId: string;
  demoSpreadsheetId: string;
  clientId: string;
  clientSecret: string;
}

export async function getGoogleApisConfig(
  secrets: SecretConfig
): Promise<ChillsGoogleApisConfig> {
  const [
    refreshToken,
    spreadsheetId,
    demoSpreadsheetId,
    clientId,
    clientSecret,
  ] = await Promise.all([
    secrets.get("CHILLS_GOOGLE_APIS_REFRESH_TOKEN"),
    secrets.get("CHILLS_KITS_GOOGLE_SHEETS_ID"),
    secrets.get("CHILLS_DEMO_KITS_GOOGLE_SHEETS_ID"),
    secrets.get("CHILLS_GOOGLE_APIS_CLIENT_ID"),
    secrets.get("CHILLS_GOOGLE_APIS_CLIENT_SECRET"),
  ]);

  return {
    refreshToken,
    spreadsheetId,
    demoSpreadsheetId,
    clientId,
    clientSecret,
  };
}
