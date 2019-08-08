// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { defineModel, Model, stringColumn } from "./sql/sql";
import { Sequelize } from "sequelize";

export interface SecretAttributes {
  id?: number;
  key: string;
  value: string;
}

export function defineSecret(sql: Sequelize): Model<SecretAttributes> {
  return defineModel<SecretAttributes>(sql, "secrets", {
    key: stringColumn(),
    value: stringColumn(),
  });
}
