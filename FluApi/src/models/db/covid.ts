// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Sequelize } from "sequelize";
import {
  Inst,
  Model,
  SplitSql,
  bigIntColumn,
  booleanColumn,
  dateColumn,
  defineModel,
  integerColumn,
  floatColumn,
  jsonColumn,
  jsonbColumn,
  stringColumn,
  unique,
  nullable,
} from "../../util/sql";
import {
  DeviceInfo,
  PhotoDbInfo,
  SurveyNonPIIInfo,
} from "audere-lib/dist/chillsProtocol";
import {
  FirebaseAnalyticsAttributes,
  FirebaseAnalyticsTableAttributes,
} from "./firebaseAnalytics";

const schema = "chills";

export function defineCovidModels(sql: SplitSql): CovidModels {
  const models: CovidModels = {
    surveys: null,
  };

  return models;
}

export interface CovidModels {
  surveys: Model<string>;
}

// ---------------------------------------------------------------

// Screens/Surveys can be fixed up later.  We therefore have a current
// table that keeps the live data, and a backup table that keeps originals
// if a fixup has been applied.
export enum EditableTableType {
  CURRENT = "current",
  BACKUP = "backup",
}

// ---------------------------------------------------------------

export interface SurveyAttributes {
  survey: string;
}
export function defineSurvey(sql: SplitSql): Model<SurveyAttributes> {
  return defineModel<SurveyAttributes>(
    sql.nonPii,
    "surveys",
    {
      survey: stringColumn(),
    },
    { schema }
  );
}
