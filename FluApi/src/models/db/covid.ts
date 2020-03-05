// Copyright (c) 2020 by Audere
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

const schema = "covid";

export function defineCovidModels(sql: SplitSql): CovidModels {
  const models: CovidModels = {
    importProblem: defineImportProblem(sql),
    survey: defineSurvey(sql),
    workflowEvents: defineWorkflowEvent(sql),
  };

  return models;
}

export interface CovidModels {
  importProblem: Model<ImportProblemAttributes>;
  survey: Model<SurveyAttributes>;
  workflowEvents: Model<WorkflowEventAttributes>;
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

export interface ImportProblemAttributes {
  id?: string;
  firebaseId: string;
  firebaseCollection: string;
  attempts: number;
  lastError: string;
}
export function defineImportProblem(
  sql: SplitSql
): Model<ImportProblemAttributes> {
  return defineModel<ImportProblemAttributes>(
    sql.nonPii,
    "import_problems",
    {
      firebaseId: stringColumn("firebase_id"),
      firebaseCollection: stringColumn("firebase_collection"),
      attempts: integerColumn(),
      lastError: stringColumn("last_error"),
    },
    { schema }
  );
}

export interface SurveyAttributes {
  id?: string;
  uid: string;
  phone: string;
  survey: string;
  updatedAt?: Date;
  createdAt?: Date;
}
export function defineSurvey(sql: SplitSql): Model<SurveyAttributes> {
  return defineModel<SurveyAttributes>(
    sql.nonPii,
    "surveys",
    {
      uid: unique(stringColumn()),
      phone: stringColumn(),
      survey: jsonColumn("body"),
      updatedAt: dateColumn(),
      createdAt: dateColumn(),
    },
    { schema }
  );
}

export interface WorkflowEventAttributes {
  eventType: string;
  token: string;
  timestamp: string;
}
export function defineWorkflowEvent(
  sql: SplitSql
): Model<WorkflowEventAttributes> {
  return defineModel<WorkflowEventAttributes>(
    sql.nonPii,
    "workflow_events",
    {
      eventType: stringColumn(),
      token: stringColumn(),
      timestamp: stringColumn(),
    },
    { schema }
  );
}
