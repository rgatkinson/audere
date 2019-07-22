// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { promises as fsPromise } from "fs";
import { SplitSql, Model } from "./sql";
import { SecretAttributes, defineSecret } from "../models/db/secrets";
import { generateRandomKey } from "./crypto";

export class SecretConfig {
  private readonly secretModel: Model<SecretAttributes>;

  constructor(sql: SplitSql) {
    this.secretModel = defineSecret(sql);
  }

  public async get(key: string): Promise<string> {
    return process.env[key] || (await this.getFromDb(key, false));
  }

  public async getOrCreate(key: string): Promise<string> {
    return process.env[key] || (await this.getFromDb(key, true));
  }

  public async getMaybeEnvFile(key: string): Promise<string> {
    return (await this.envFile(key)) || (await this.getFromDb(key, false));
  }

  private async envFile(key: string): Promise<string | null> {
    const envVar = process.env[key];

    if (envVar == null) {
      return null;
    } else {
      try {
        return await fsPromise.readFile(envVar, { encoding: "utf8" });
      } catch {
        throw new Error(
          'Could not find file "' +
            key +
            '", check to make sure that it exists.'
        );
      }
    }
  }

  private async getFromDb(
    key: string,
    createIfNotFound: boolean
  ): Promise<string> {
    const secret = await this.secretModel.findOne({ where: { key } });
    if (secret != null) {
      return secret.value;
    }

    if (createIfNotFound) {
      const value = await generateRandomKey(64);
      await this.secretModel.create({ key, value });
      return value;
    } else {
      throw Error(
        `${key} is unset. Copy .env.example to .env or update the ` +
          `value in the database. An unset value could cause application ` +
          `instability or errors.`
      );
    }
  }
}
