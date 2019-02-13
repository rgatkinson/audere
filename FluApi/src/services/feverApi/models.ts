// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Model as SqlModel, Sequelize } from "sequelize";
import {
  defineModel,
  Inst,
  Model,
  SplitSql,
  stringColumn,
  booleanColumn,
  jsonColumn,
  integerColumn,
  unique,
} from "../../util/sql"
import {
  DeviceInfo,
  LogLevel,
  LogBatchInfo,
  PIIInfo,
  SurveyNonPIIDbInfo
} from "audere-lib/feverProtocol";

// ---------------------------------------------------------------

export function defineFeverModels(sql: SplitSql): FeverModels {
  return {
    accessKey: defineAccessKey(sql),
    clientLog: defineClientLog(sql),
    clientLogBatch: defineLogBatch(sql),
    feedback: defineFeedback(sql),
    surveyNonPii: defineSurvey(sql.nonPii),
    surveyPii: defineSurvey(sql.pii),
  }
}
export interface FeverModels {
  accessKey: Model<AccessKeyAttributes>;
  clientLog: Model<ClientLogAttributes>;
  clientLogBatch: Model<LogBatchAttributes>;
  feedback: Model<FeedbackAttributes>;
  surveyNonPii: Model<SurveyAttributes<SurveyNonPIIDbInfo>>;
  surveyPii: Model<SurveyAttributes<PIIInfo>>;
}

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
export function defineAccessKey(sql: SplitSql): Model<AccessKeyAttributes> {
  return defineModel<AccessKeyAttributes>(
    sql.nonPii,
    "fever_access_keys",
    {
      key: stringColumn(),
      valid: booleanColumn()
    }
  );
}

// ---------------------------------------------------------------

interface ClientLogAttributes {
  id?: string;
  device: DeviceInfo;
  log: string;
  level: LogLevel;
}
export function defineClientLog(sql: SplitSql): Model<ClientLogAttributes> {
  return defineModel<ClientLogAttributes>(
    sql.nonPii,
    "fever_client_logs",
    {
      device: jsonColumn(),
      log: stringColumn(),
      level: integerColumn(),
    }
  );
}

// ---------------------------------------------------------------

export interface LogBatchAttributes {
  id?: string;
  device: DeviceInfo;
  csruid: string;
  batch: LogBatchInfo;
}
export type LogBatchInstance = Inst<LogBatchAttributes>;
export function defineLogBatch(sql: SplitSql): Model<LogBatchAttributes> {
  return defineModel<LogBatchAttributes>(
    sql.nonPii,
    "fever_client_log_batches",
    {
      device: jsonColumn(),
      csruid: unique(stringColumn()),
      batch: jsonColumn()
    }
  );
}

// ---------------------------------------------------------------

interface FeedbackAttributes {
  id?: string;
  device: DeviceInfo;
  subject: string;
  body: string;
}
export function defineFeedback(sql: SplitSql): Model<FeedbackAttributes> {
  return defineModel<FeedbackAttributes>(
    sql.nonPii,
    "fever_feedback",
    {
      device: jsonColumn(),
      subject: stringColumn(),
      body: stringColumn(),
    }
  );
}

// ---------------------------------------------------------------

export interface SurveyAttributes<Info> {
  id?: string;
  device: DeviceInfo;
  csruid: string;
  survey: Info;
}
export function defineSurvey<Info>(
  sql: Sequelize,
  editableType = EditableTableType.CURRENT
): SurveyModel<Info> {
  return defineModel<SurveyAttributes<Info>>(
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
export type SurveyModel<Info> = Model<SurveyAttributes<Info>>;
