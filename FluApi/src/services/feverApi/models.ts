// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import Sequelize, { Model, Sequelize as Sql, DefineModelAttributes } from "sequelize";
import "../util/config";
import { DeviceInfo, LogLevel, LogBatchInfo, PIIInfo, SurveyNonPIIDbInfo } from "audere-lib/feverProtocol";

// ---------------------------------------------------------------

export const sequelizeNonPII = new Sequelize(process.env.NONPII_DATABASE_URL, {
  logging: false,
});

export const sequelizePII = new Sequelize(process.env.PII_DATABASE_URL, {
  logging: false,
});

// ---------------------------------------------------------------

interface AccessKeyAttributes {
  id?: string;
  key: string;
  valid: boolean;
}
export const AccessKey = defineNonPII<AccessKeyAttributes>(
  "fever_access_keys",
  {
    key: stringColumn(),
    valid: booleanColumn()
  }
);

// ---------------------------------------------------------------

interface ClientLogAttributes {
  id?: string;
  log: string;
  level: LogLevel;
  device: DeviceInfo;
}
export const ClientLog = defineNonPII<ClientLogAttributes>(
  "fever_client_logs",
  {
    log: stringColumn(),
    level: integerColumn(),
    device: jsonColumn()
  }
);

// ---------------------------------------------------------------

export interface LogBatchAttributes {
  id?: string;
  csruid: string;
  device: DeviceInfo;
  batch: LogBatchInfo;
}
export type LogBatchInstance = Inst<LogBatchAttributes>;
export const ClientLogBatch = defineNonPII<LogBatchAttributes>(
  "fever_client_log_batches",
  {
    csruid: unique(stringColumn()),
    device: jsonColumn(),
    batch: jsonColumn(),
  }
);

// ---------------------------------------------------------------

interface FeedbackAttributes {
  id?: string;
  subject: string;
  body: string;
  device: DeviceInfo;
}
export const Feedback = defineNonPII<FeedbackAttributes>(
  "fever_feedback",
  {
    subject: stringColumn(),
    body: stringColumn(),
    device: jsonColumn(),
  }
);

// ---------------------------------------------------------------

export interface SurveyAttributes<Info> {
  id?: string;
  csruid: string;
  device: DeviceInfo;
  survey: Info;
}
export const SurveyNonPII = defineSurvey<SurveyNonPIIDbInfo>(sequelizeNonPII);
export const SurveyPII = defineSurvey<PIIInfo>(sequelizePII);

// Make these internals public to support editing/backup
export function defineSurvey<Info>(sql: Sql, editableType = EditableTableType.CURRENT): SurveyModel<Info> {
  return defineSql<SurveyAttributes<Info>>(
    sql,
    `fever_${editableType}_surveys`,
    {
      csruid: stringColumn(),
      device: jsonColumn(),
      survey: jsonColumn(),
    }
  );
}
export type SurveyInstance<Info> = Inst<SurveyAttributes<Info>>;
export type SurveyModel<Info> = Model<SurveyInstance<Info>, SurveyAttributes<Info>>;

// ---------------------------------------------------------------

// Screens/Surveys are split across two databases.  One contains PII and
// the other contains all the rest of the data.  The database schema is
// identical, but we create two separate TypeScript types to help keep
// things straight.
export enum PersonalInfoType {
  PII = "PII",
  NonPII = "NON_PII"
}

// Screens/Surveys can be fixed up later.  We therefore have a current
// table that keeps the live data, and a backup table that keeps originals
// if a fixup has been applied.
export enum EditableTableType {
  CURRENT = "current",
  BACKUP = "backup",
}

// ---------------------------------------------------------------
// Helper types and methods

type Inst<Attr> = Sequelize.Instance<Attr> & Attr;

function defineNonPII<Attr>(name, attr: DefineModelAttributes<Attr>) {
  return defineSql(sequelizeNonPII, name, attr);
}
function defineSql<Attr>(sql: Sql, name: string, attr: DefineModelAttributes<Attr>): Model<Inst<Attr>, Attr> {
  // The sequelize type definition makes define return Model<any,any>, so cast to recover type info.
  return <Model<Inst<Attr>, Attr>><any>sql.define<Inst<Attr>, Attr>(name, attr, freezeTableName());
}

function freezeTableName() {
  return { freezeTableName: true };
}
function unique(column) {
  return { ...column, unique: true };
}
function stringColumn() {
  return column(Sequelize.STRING);
}
function booleanColumn() {
  return column(Sequelize.BOOLEAN);
}
function jsonColumn() {
  return column(Sequelize.JSON);
}
function integerColumn() {
  return column(Sequelize.INTEGER);
}
function dateColumn() {
  return column(Sequelize.DATE);
}
function column(type) {
  return { allowNull: false, type };
}
