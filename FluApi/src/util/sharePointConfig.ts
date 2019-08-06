// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SecretConfig } from "./secretsConfig";

export interface SharePointConfig {
  url: string;
  clientId: string;
  clientSecret: string;
  incentivesFolder: string;
  kitsFolder: string;
}

let lazy: Promise<SharePointConfig> | null = null;

export function getSharePointConfig(
  secrets: SecretConfig
): Promise<SharePointConfig> {
  if (lazy != null) {
    return lazy;
  }
  lazy = createConfig(secrets);
  return lazy;
}

async function createConfig(secrets: SecretConfig): Promise<SharePointConfig> {
  const [
    url,
    clientId,
    clientSecret,
    incentivesFolder,
    kitsFolder,
  ] = await Promise.all([
    secrets.get("SHAREPOINT_URL"),
    secrets.get("SHAREPOINT_CLIENT_ID"),
    secrets.get("SHAREPOINT_CLIENT_SECRET"),
    secrets.get("SHAREPOINT_INCENTIVES_FOLDER"),
    secrets.get("SHAREPOINT_KITS_FOLDER"),
  ]);
  return { url, clientId, clientSecret, incentivesFolder, kitsFolder };
}
