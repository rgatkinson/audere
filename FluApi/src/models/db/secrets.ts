// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { defineModel, Model, SplitSql, stringColumn } from "../../util/sql";

export interface SecretAttributes {
  id?: number;
  key: string;
  value: string;
}

export function defineSecret(sql: SplitSql): Model<SecretAttributes> {
  return defineModel<SecretAttributes>(sql.nonPii, "secrets", {
    key: stringColumn(),
    value: stringColumn()
  });
}
