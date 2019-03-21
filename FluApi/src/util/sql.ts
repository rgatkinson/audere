// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import Sequelize, {
  DefineModelAttributes,
  Sequelize as Sql,
  BOOLEAN as SQL_BOOLEAN,
  DATE as SQL_DATE,
  FLOAT as SQL_FLOAT,
  INTEGER as SQL_INTEGER,
  JSON as SQL_JSON,
  STRING as SQL_STRING
} from "sequelize";
import "../util/config";
import logger from "./logger";

export type Inst<Attr> = Sequelize.Instance<Attr> & Attr;

export type Model<Attr> = Sequelize.Model<Inst<Attr>, Attr>;

export interface SplitSql {
  piiUrl: string;
  pii: Sql;
  nonPiiUrl: string;
  nonPii: Sql;
  close: () => Promise<void>;
}

export function createSplitSql(): SplitSql {
  const nonPiiUrl = process.env.NONPII_DATABASE_URL;
  const piiUrl = process.env.PII_DATABASE_URL;
  if (!nonPiiUrl || !piiUrl) {
    throw new Error("Copy .env.example to .env and customize stuff :)");
  }

  const pii = new Sequelize(piiUrl, {
    logging: process.env.LOG_SQL && logger.debug,
    operatorsAliases: false
  });
  const nonPii = new Sequelize(nonPiiUrl, {
    operatorsAliases: false,
    logging: process.env.LOG_SQL && logger.debug
  });
  return {
    pii,
    piiUrl,
    nonPii,
    nonPiiUrl,
    close: async () => {
      Promise.all([pii.close(), nonPii.close()]);
    }
  };
}

export function defineModel<Attr>(
  sql: Sql,
  name: string,
  attr: DefineModelAttributes<Attr>
): Model<Attr> {
  // The sequelize type definition makes define return SqlModel<any,any>, so cast to recover type info.
  return sql.define<Inst<Attr>, Attr>(name, attr, { freezeTableName: true });
}

export function primaryKey(column) {
  return { ...column, primaryKey: true };
}
export function unique(column) {
  return { ...column, unique: true };
}
export function nullable(column) {
  return { ...column, allowNull: true };
}
export function stringColumn(field?: string) {
  return column(SQL_STRING, field);
}
export function booleanColumn(field?: string) {
  return column(SQL_BOOLEAN, field);
}
export function jsonColumn<T>(field?: string) {
  return column(SQL_JSON, field);
}
export function integerColumn(field?: string) {
  return column(SQL_INTEGER, field);
}
export function dateColumn(field?: string) {
  return column(SQL_DATE, field);
}
export function floatColumn(field?: string) {
  return column(SQL_FLOAT, field);
}
export function foreignIdKey(column, model) {
  return {
    ...column,
    unique: true,
    references: { model, key: "id" },
    onDelete: "CASCADE"
  };
}
export function column(type, field?: string) {
  if (field == null) {
    return { allowNull: false, type };
  } else {
    return { allowNull: false, type, field };
  }
}
