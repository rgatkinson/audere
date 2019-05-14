// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Sequelize } from "sequelize";
import {
  defineModel,
  Inst,
  Model,
  SplitSql,
  stringColumn,
  booleanColumn,
  jsonColumn,
  unique
} from "../../util/sql";

// ---------------------------------------------------------------
// TODO - import these from coughProtocol once that lands
type DeviceInfo = any;
type AnalyticsInfo = any;
type PhotoInfo = any;
type SurveyNonPIIDbInfo = any;
// ---------------------------------------------------------------

export function defineCoughModels(sql: SplitSql): CoughModels {
  const models: CoughModels = {
    accessKey: defineAccessKey(sql),
    clientLogBatch: defineLogBatch(sql),
    photo: definePhoto(sql),
    survey: defineSurvey(sql.nonPii)
  };

  return models;
}

export interface CoughModels {
  accessKey: Model<AccessKeyAttributes>;
  clientLogBatch: Model<AnalyticsAttributes>;
  photo: Model<PhotoAttributes>;
  survey: Model<SurveyAttributes<SurveyNonPIIDbInfo>>;
}

// ---------------------------------------------------------------

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
  return defineModel<AccessKeyAttributes>(sql.nonPii, "fever_access_keys", {
    key: stringColumn(),
    valid: booleanColumn()
  });
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

export interface PhotoAttributes {
  id?: string;
  device: DeviceInfo;
  csruid: string;
  photo: PhotoInfo;
}
export function definePhoto(sql: SplitSql): Model<PhotoAttributes> {
  return defineModel<PhotoAttributes>(sql.nonPii, "fever_photos", {
    device: jsonColumn(),
    csruid: unique(stringColumn()),
    photo: jsonColumn()
  });
}

// ---------------------------------------------------------------

export interface SurveyAttributes<Info> {
  id?: string;
  device: DeviceInfo;
  docid: string;
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
      docid: unique(stringColumn()),
      survey: jsonColumn()
    }
  );
}
export type SurveyInstance<Info> = Inst<SurveyAttributes<Info>>;
export type SurveyModel<Info> = Model<SurveyAttributes<Info>>;
