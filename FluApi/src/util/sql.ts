// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import dotenv from "dotenv";
import Sequelize, {
  DefineModelAttributes,
  Model as SqlModel,
  Instance as SqlInstance,
  Sequelize as Sql,
  BOOLEAN as SQL_BOOLEAN,
  INTEGER as SQL_INTEGER,
  JSON as SQL_JSON,
  STRING as SQL_STRING,
} from "sequelize";
import "../util/config";

export type Inst<Attr> = SqlInstance<Attr> & Attr;

export type Model<Attr> = SqlModel<Inst<Attr>, Attr>;

export interface SplitSql {
  pii: Sql;
  nonPii: Sql;
  close: () => Promise<void>;
}

export function createSplitSql(): SplitSql {
  dotenv.config();
  if (!process.env.NONPII_DATABASE_URL) {
    throw new Error("Copy .env.example to .env and customize stuff :)");
  }
  if (!process.env.PII_DATABASE_URL) {
    throw new Error("Copy .env.example to .env and customize stuff :)");
  }

  const pii = new Sequelize(process.env.PII_DATABASE_URL, { logging: false });
  const nonPii = new Sequelize(process.env.NONPII_DATABASE_URL, {
    // This globally enables search path options, if not enabled search path
    // options are deleted from config. This is needed for querying census data.
    dialectOptions: {
      prependSearchPath: true
    },
    logging: false
  });
  return {
    pii,
    nonPii,
    close: async () => {
      Promise.all([pii.close(), nonPii.close()]);
    },
  };
}

export function defineModel<Attr>(
  sql: Sql,
  name: string,
  attr: DefineModelAttributes<Attr>
): SqlModel<Inst<Attr>, Attr> {
  // The sequelize type definition makes define return SqlModel<any,any>, so cast to recover type info.
  return <SqlModel<Inst<Attr>, Attr>>(
    (<any>sql.define<Inst<Attr>, Attr>(name, attr, { freezeTableName: true }))
  );
}

export function unique(column) {
  return { ...column, unique: true };
}
export function nullable(column) {
  return { ...column, allowNull: true };
}
export function stringColumn() {
  return column(SQL_STRING);
}
export function booleanColumn() {
  return column(SQL_BOOLEAN);
}
export function jsonColumn<T>() {
  return column(SQL_JSON);
}
export function integerColumn() {
  return column(SQL_INTEGER);
}
export function column(type) {
  return { allowNull: false, type };
}
