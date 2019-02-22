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
  PIIInfo,
  SurveyNonPIIDbInfo,
  AnalyticsInfo,
  PhotoInfo
} from "audere-lib/feverProtocol";

// ---------------------------------------------------------------

export function defineFeverModels(sql: SplitSql): FeverModels {
  return {
    accessKey: defineAccessKey(sql),
    clientLogBatch: defineLogBatch(sql),
    feedback: defineFeedback(sql),
    photo: definePhoto(sql),
    surveyNonPii: defineSurvey(sql.nonPii),
    surveyPii: defineSurvey(sql.pii),
  }
}
export interface FeverModels {
  accessKey: Model<AccessKeyAttributes>;
  clientLogBatch: Model<AnalyticsAttributes>;
  feedback: Model<FeedbackAttributes>;
  photo: Model<PhotoAttributes>;
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

export interface AnalyticsAttributes {
  id?: string;
  device: DeviceInfo;
  csruid: string;
  analytics: AnalyticsInfo;
}
export type LogBatchInstance = Inst<AnalyticsAttributes>;
export function defineLogBatch(sql: SplitSql): Model<AnalyticsAttributes> {
  return defineModel<AnalyticsAttributes>(
    sql.nonPii,
    "fever_client_analytics",
    {
      device: jsonColumn(),
      csruid: unique(stringColumn()),
      analytics: jsonColumn()
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

export interface PhotoAttributes {
  id?: string;
  device: DeviceInfo;
  csruid: string;
  photo: PhotoInfo;
}
export function definePhoto(sql: SplitSql): Model<PhotoAttributes> {
  return defineModel<PhotoAttributes>(
    sql.nonPii,
    "fever_client_analytics",
    {
      device: jsonColumn(),
      csruid: unique(stringColumn()),
      photo: jsonColumn()
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
