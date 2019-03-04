// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SecretConfig } from "./secretsConfig";

export interface S3Config {
  bucket: string;
}

let lazy: Promise<S3Config> | null = null;

export function getS3Config(secrets: SecretConfig): Promise<S3Config> {
  if (lazy != null) {
    return lazy;
  }
  lazy = createConfig(secrets);
  return lazy;
}

async function createConfig(secrets: SecretConfig): Promise<S3Config> {
  const [bucket] =
    await Promise.all([
      secrets.get("S3_REPORT_BUCKET")
    ]);
  return { bucket };
}