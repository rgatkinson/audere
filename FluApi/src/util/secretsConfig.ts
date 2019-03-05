// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SplitSql, Model } from "./sql";
import { SecretAttributes, defineSecret } from "../models/secrets";

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
}
