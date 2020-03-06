// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  Model,
  defineModel,
  unique,
  stringColumn,
  SplitSql,
  primaryKey,
  dateColumn,
  foreignIdKey,
} from "../../util/sql";

export const SESSION_TABLE_NAME = "site_sessions";

export function defineSiteUserModels(sql: SplitSql): SiteUserModels {
  const userModel = defineUser(sql);
  return {
    user: userModel,
    session: defineSession(sql),
    permissions: definePermissions(sql, userModel),
  };
}

export interface SiteUserModels {
  user: Model<UserAttributes>;
  session: Model<SessionAttributes>;
  permissions: Model<UserPermissionAttributes>;
}

export function defineUser(sql: SplitSql): Model<UserAttributes> {
  return defineModel<UserAttributes>(sql.pii, "site_users", {
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

export function defineSession(sql: SplitSql): Model<SessionAttributes> {
  return defineModel<SessionAttributes>(sql.pii, SESSION_TABLE_NAME, {
    sid: primaryKey(stringColumn()),
    expires: dateColumn(),
    data: stringColumn(),
  });
}
export interface SessionAttributes {
  sid: string;
  expires: string;
  data: string;
}

export function definePermissions(
  sql: SplitSql,
  userModel: Model<UserAttributes>
): Model<UserPermissionAttributes> {
  return defineModel<UserPermissionAttributes>(
    sql.pii,
    "site_user_permissions",
    {
      userId: foreignIdKey(stringColumn(), userModel),
      permission: stringColumn(),
    }
  );
}
export interface UserPermissionAttributes {
  id?: string;
  userId: string;
  permission: string;
}
