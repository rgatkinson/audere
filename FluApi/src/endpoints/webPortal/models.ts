// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Model, defineModel, unique, stringColumn, SplitSql } from "../../util/sql";

export function defineUser(sql: SplitSql): Model<UserAttributes> {
  return defineModel<UserAttributes>(sql.pii, "portal_users", {
    uuid: unique(stringColumn()),
    userid: unique(stringColumn()),
    salt: stringColumn(),
    token: stringColumn(),
  });
}
export interface UserAttributes {
  id?: string;
  uuid: string;
  userid: string;
  salt: string;
  token: string;
}
