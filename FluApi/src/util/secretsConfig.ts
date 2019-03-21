// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SplitSql, Model } from "./sql";
import { SecretAttributes, defineSecret } from "../models/db/secrets";
import { generateRandomKey } from "./crypto";

export class SecretConfig {
  private readonly secretModel: Model<SecretAttributes>;

  constructor(sql: SplitSql) {
    this.secretModel = defineSecret(sql);
  }

  public async get(key: string): Promise<string> {
    // First check process environment variables.
    const envVar = process.env[key];
    if (envVar != null) {
      return envVar;
    }

    const secret = await this.secretModel.findOne({ where: { key: key } });
    if (secret != null) {
      return secret.value;
    }

    throw Error(
      `${key} is unset. Copy .env.example to .env or update the ` +
        `value in the database. An unset value could application instability ` +
        `or errors.`
    );
  }

  // TODO: getRotatingSecret(key: string): Promise<string[]>
  public async getOrCreate(key: string): Promise<string> {
    const envVar = process.env[key];
    if (envVar != null) {
      return envVar;
    }

    const record = await this.secretModel.findOne({ where: { key } });
    if (record != null) {
      return record.value;
    }

    const value = await generateRandomKey(64);
    await this.secretModel.create({ key, value });
    return value;
  }
}
