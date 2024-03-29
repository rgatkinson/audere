// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import Sequelize, {
  DefineModelAttributes,
  DefineOptions,
  Sequelize as Sql,
  BIGINT as SQL_BIGINT,
  BOOLEAN as SQL_BOOLEAN,
  DATE as SQL_DATE,
  DECIMAL as SQL_DECIMAL,
  ENUM as SQL_ENUM,
  FLOAT as SQL_FLOAT,
  INTEGER as SQL_INTEGER,
  JSON as SQL_JSON,
  JSONB as SQL_JSONB,
  STRING as SQL_STRING,
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

function sequelizeLogger(rawLog: string) {
  if (rawLog.startsWith("Executing") && rawLog.length > 200) {
    // Sequelize logs each query it executes, followed by an enormous options object. This
    // trims the log statements down to just the query to make it less verbose
    logger.debug(rawLog.split(";")[0] + ";...");
  } else {
    logger.debug(rawLog);
  }
}

export function createSplitSql(): SplitSql {
  const nonPiiUrl = nonPiiDatabaseUrl();
  const piiUrl = piiDatabaseUrl();
  if (!nonPiiUrl || !piiUrl) {
    throw new Error("Copy .env.example to .env and customize stuff :)");
  }

  const pii = new Sequelize(piiUrl, {
    logging: process.env.LOG_SQL && sequelizeLogger,
    operatorsAliases: false,
  });
  const nonPii = new Sequelize(nonPiiUrl, {
    logging: process.env.LOG_SQL && sequelizeLogger,
    operatorsAliases: false,
  });
  return {
    pii,
    piiUrl,
    nonPii,
    nonPiiUrl,
    close: async () => {
      Promise.all([pii.close(), nonPii.close()]);
    },
  };
}

export function nonPiiDatabaseUrl() {
  return process.env.NONPII_DATABASE_URL;
}

export function piiDatabaseUrl() {
  return process.env.PII_DATABASE_URL;
}

export function defineModel<Attr>(
  sql: Sql,
  name: string,
  attr: DefineModelAttributes<Attr>,
  options: DefineOptions<Inst<Attr>> = {}
): Model<Attr> {
  // The sequelize type definition makes define return SqlModel<any,any>, so cast to recover type info.
  return sql.define<Inst<Attr>, Attr>(name, attr, {
    ...options,
    freezeTableName: true,
  });
}

export function primaryKey(column) {
  return { ...column, primaryKey: true };
}
export function unique(column, compositeKeyName?: string) {
  return {
    ...column,
    unique: compositeKeyName === undefined ? true : compositeKeyName,
  };
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
export function jsonbColumn<T>(field?: string) {
  return column(SQL_JSONB, field);
}
export function integerColumn(field?: string) {
  return column(SQL_INTEGER, field);
}
export function bigIntColumn(field?: string) {
  return column(SQL_BIGINT, field);
}
export function dateColumn(field?: string) {
  return column(SQL_DATE, field);
}
export function floatColumn(field?: string) {
  return column(SQL_FLOAT, field);
}
export function decimalColumn(field: string, precision: number, scale: number) {
  return column(SQL_DECIMAL(precision, scale), field);
}
export function enumColumn(field: string, values: string[]) {
  return column(SQL_ENUM(...values), field);
}

export function foreignIdKey(column, model) {
  return {
    ...column,
    unique: true,
    references: { model, key: "id" },
    onDelete: "CASCADE",
  };
}
export function column(type, field?: string) {
  if (field == null) {
    return { allowNull: false, type };
  } else {
    return { allowNull: false, type, field };
  }
}
