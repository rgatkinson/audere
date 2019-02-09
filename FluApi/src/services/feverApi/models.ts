// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  DefineModelAttributes,
  Model as SqlModel,
  Instance as SqlInstance,
  Sequelize,
  BOOLEAN as SQL_BOOLEAN,
  INTEGER as SQL_INTEGER,
  JSON as SQL_JSON,
  STRING as SQL_STRING,
} from "sequelize";
import {
  DeviceInfo,
  LogLevel,
  LogBatchInfo,
  PIIInfo,
  SurveyNonPIIDbInfo
} from "audere-lib/feverProtocol";
import { sequelizeNonPII, sequelizePII } from "../../models";

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
  BACKUP = "backup"
}

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
  device: DeviceInfo;
  log: string;
  level: LogLevel;
}
export const ClientLog = defineNonPII<ClientLogAttributes>(
  "fever_client_logs",
  {
    device: jsonColumn(),
    log: stringColumn(),
    level: integerColumn(),
  }
);

// ---------------------------------------------------------------

export interface LogBatchAttributes {
  id?: string;
  device: DeviceInfo;
  csruid: string;
  batch: LogBatchInfo;
}
export type LogBatchInstance = Inst<LogBatchAttributes>;
export const ClientLogBatch = defineNonPII<LogBatchAttributes>(
  "fever_client_log_batches",
  {
    device: jsonColumn(),
    csruid: unique(stringColumn()),
    batch: jsonColumn()
  }
);

// ---------------------------------------------------------------

interface FeedbackAttributes {
  id?: string;
  device: DeviceInfo;
  subject: string;
  body: string;
}
export const Feedback = defineNonPII<FeedbackAttributes>("fever_feedback", {
  device: jsonColumn(),
  subject: stringColumn(),
  body: stringColumn(),
});

// ---------------------------------------------------------------

export interface SurveyAttributes<Info> {
  id?: string;
  device: DeviceInfo;
  csruid: string;
  survey: Info;
}
export const SurveyNonPII = defineSurvey<SurveyNonPIIDbInfo>(sequelizeNonPII);
export const SurveyPII = defineSurvey<PIIInfo>(sequelizePII);

// Make these internals public to support editing/backup
export function defineSurvey<Info>(
  sql: Sequelize,
  editableType = EditableTableType.CURRENT
): SurveyModel<Info> {
  return defineSql<SurveyAttributes<Info>>(
    sql,
    `fever_${editableType}_surveys`,
    {
      device: jsonColumn(),
      csruid: unique(stringColumn()),
      survey: jsonColumn()
    }
  );
}
export type SurveyInstance<Info> = Inst<SurveyAttributes<Info>>;
export type SurveyModel<Info> = SqlModel<
  SurveyInstance<Info>,
  SurveyAttributes<Info>
>;

// ---------------------------------------------------------------
// Helper types and methods

type Inst<Attr> = SqlInstance<Attr> & Attr;

function defineNonPII<Attr>(name, attr: DefineModelAttributes<Attr>) {
  return defineSql(sequelizeNonPII, name, attr);
}
function defineSql<Attr>(
  sql: Sequelize,
  name: string,
  attr: DefineModelAttributes<Attr>
): SqlModel<Inst<Attr>, Attr> {
  // The sequelize type definition makes define return SqlModel<any,any>, so cast to recover type info.
  return <SqlModel<Inst<Attr>, Attr>>(
    (<any>sql.define<Inst<Attr>, Attr>(name, attr, freezeTableName()))
  );
}

function freezeTableName() {
  return { freezeTableName: true };
}
function unique(column) {
  return { ...column, unique: true };
}
function stringColumn() {
  return column(SQL_STRING);
}
function booleanColumn() {
  return column(SQL_BOOLEAN);
}
function jsonColumn() {
  return column(SQL_JSON);
}
function integerColumn() {
  return column(SQL_INTEGER);
}
function column(type) {
  return { allowNull: false, type };
}
