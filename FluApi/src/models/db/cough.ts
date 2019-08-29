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
  integerColumn,
  jsonColumn,
  dateColumn,
  nullable,
  unique,
  jsonbColumn,
  bigIntColumn,
} from "../../util/sql";
import {
  DeviceInfo,
  PhotoDbInfo,
  SurveyNonPIIInfo,
} from "audere-lib/dist/coughProtocol";

const schema = "cough";

export function defineCoughModels(sql: SplitSql): CoughModels {
  const models: CoughModels = {
    accessKey: defineAccessKey(sql),
    asprenData: defineAsprenData(sql),
    asprenFile: defineAsprenFile(sql),
    expertRead: defineExpertRead(sql),
    firebaseAnalytics: defineFirebaseAnalytics(sql),
    firebaseAnalyticsTable: defineFirebaseAnalayticsTable(sql),
    importProblem: defineImportProblem(sql),
    photo: definePhoto(sql),
    photoUploadLog: definePhotoUploadLog(sql),
    survey: defineSurvey(sql.nonPii),
  };

  models.survey.hasOne(models.photoUploadLog, {
    foreignKey: "cough_survey_id",
    onDelete: "CASCADE",
  });

  return models;
}

export interface CoughModels {
  accessKey: Model<AccessKeyAttributes>;
  asprenData: Model<AsprenDataAttributes>;
  asprenFile: Model<AsprenFileAttributes>;
  expertRead: Model<ExpertReadAttributes>;
  firebaseAnalytics: Model<FirebaseAnalyticsAttributes>;
  firebaseAnalyticsTable: Model<FirebaseAnalyticsTableAttributes>;
  importProblem: Model<ImportProblemAttributes>;
  photo: Model<PhotoAttributes>;
  photoUploadLog: Model<PhotoUploadLogAttributes>;
  survey: Model<SurveyAttributes<SurveyNonPIIInfo>>;
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

interface AccessKeyAttributes {
  id?: string;
  key: string;
  valid: boolean;
}
export function defineAccessKey(sql: SplitSql): Model<AccessKeyAttributes> {
  return defineModel<AccessKeyAttributes>(
    sql.nonPii,
    "access_keys",
    {
      key: stringColumn(),
      valid: booleanColumn(),
    },
    { schema }
  );
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

// ---------------------------------------------------------------

export interface PhotoAttributes {
  id?: string;
  docId: string;
  device: DeviceInfo;
  photo: PhotoDbInfo;
}
export function definePhoto(sql: SplitSql): Model<PhotoAttributes> {
  return defineModel<PhotoAttributes>(
    sql.nonPii,
    "photos",
    {
      docId: unique(stringColumn("docid")),
      device: jsonColumn(),
      photo: jsonColumn(),
    },
    { schema }
  );
}

// ---------------------------------------------------------------

export interface PhotoUploadLogAttributes {
  id?: string;
  coughSurveyId: string;
}
export function definePhotoUploadLog(
  sql: SplitSql
): Model<PhotoUploadLogAttributes> {
  return defineModel<PhotoUploadLogAttributes>(
    sql.nonPii,
    "photo_upload_log",
    {
      coughSurveyId: unique(stringColumn("cough_survey_id")),
    },
    { schema }
  );
}

// ---------------------------------------------------------------

export interface SurveyAttributes<Info> {
  id?: string;
  docId: string;
  device: DeviceInfo;
  survey: Info;
  updatedAt?: Date;
  createdAt?: Date;
}
export function defineSurvey<Info>(
  sql: Sequelize,
  editableType = EditableTableType.CURRENT
): SurveyModel<Info> {
  return defineModel<SurveyAttributes<Info>>(
    sql,
    `${editableType}_surveys`,
    {
      docId: unique(stringColumn("docid")),
      device: jsonColumn(),
      survey: jsonColumn(),
      updatedAt: dateColumn(),
      createdAt: dateColumn(),
    },
    { schema }
  );
}
export type SurveyInstance<Info> = Inst<SurveyAttributes<Info>>;
export type SurveyModel<Info> = Model<SurveyAttributes<Info>>;

// ---------------------------------------------------------------

export interface AsprenFileAttributes {
  key: string;
  hash: string;
}
export function defineAsprenFile(sql: SplitSql): Model<AsprenFileAttributes> {
  return defineModel<AsprenFileAttributes>(
    sql.nonPii,
    "aspren_files",
    {
      key: unique(stringColumn()),
      hash: stringColumn(),
    },
    { schema }
  );
}

// ---------------------------------------------------------------

export enum IndigenousStatus {
  Aboriginal = "AB",
  TorresStraitIslander = "TS",
  Both = "BT",
  Unknown = "UNKNOWN",
  Yes = "Y",
  No = "N",
}

export enum CurrentSeasonVaccinationStatus {
  Received = "Y",
  NotReceived = "N",
  Unknown = "UNKNOWN",
}

export enum PreviousSeasonVaccinationStatus {
  Received = "Y",
  NotReceived = "N",
  Unknown = "UNKNOWN",
  Never = "NEVER",
}

export interface AsprenDataAttributes {
  barcode: string;
  encounterDate: string;
  encounterState: string;
  adenoResult: boolean;
  pertussisResult: boolean;
  fluAResult: boolean;
  fluBResult: boolean;
  h1n1Result: boolean;
  h3n2Result: boolean;
  metapneumovirusResult: boolean;
  mycopneumoniaResult: boolean;
  para1Result: boolean;
  para2Result: boolean;
  para3Result: boolean;
  rhinovirusResult: boolean;
  rsvResult: boolean;
  victoriaResult: boolean;
  yamagataResult: boolean;
  aboriginalOrIslander: IndigenousStatus;
  dateOnset: string;
  currentVaccination: CurrentSeasonVaccinationStatus;
  vaccinationDate: string;
  previousVaccination: PreviousSeasonVaccinationStatus;
  comorbities: boolean;
  comorbitiesDescription: string;
  healthcareWorkerStatus: boolean;
  overseasIllness: boolean;
  overseasLocation: string;
}
export function defineAsprenData(sql: SplitSql): Model<AsprenDataAttributes> {
  return defineModel<AsprenDataAttributes>(
    sql.nonPii,
    "aspren_data",
    {
      barcode: unique(stringColumn()),
      encounterDate: stringColumn("encounter_date"),
      encounterState: stringColumn("encounter_state"),
      adenoResult: nullable(booleanColumn("adeno_result")),
      pertussisResult: nullable(booleanColumn("b_pertussis_result")),
      fluAResult: nullable(booleanColumn("flu_a_result")),
      fluBResult: nullable(booleanColumn("flu_b_result")),
      h1n1Result: nullable(booleanColumn("h1n1_result")),
      h3n2Result: nullable(booleanColumn("h3n2_result")),
      metapneumovirusResult: nullable(booleanColumn("metapneumovirus_result")),
      mycopneumoniaResult: nullable(booleanColumn("mycopneumonia_result")),
      para1Result: nullable(booleanColumn("para_1_result")),
      para2Result: nullable(booleanColumn("para_2_result")),
      para3Result: nullable(booleanColumn("para_3_result")),
      rhinovirusResult: nullable(booleanColumn("rhinovirus_result")),
      rsvResult: nullable(booleanColumn("rsv_result")),
      victoriaResult: nullable(booleanColumn("victoria_result")),
      yamagataResult: nullable(booleanColumn("yamagata_result")),
      aboriginalOrIslander: {
        type: Sequelize.STRING,
        field: "atsi",
        allowNull: true,
      },
      dateOnset: stringColumn("date_onset"),
      currentVaccination: {
        type: Sequelize.STRING,
        field: "current_vaccination",
        allowNull: true,
      },
      vaccinationDate: nullable(stringColumn("vaccination_date")),
      previousVaccination: {
        type: Sequelize.STRING,
        field: "previous_vaccination",
        allowNull: true,
      },
      comorbities: nullable(booleanColumn()),
      comorbitiesDescription: nullable(stringColumn("comorbities_description")),
      healthcareWorkerStatus: nullable(booleanColumn("hcw_status")),
      overseasIllness: nullable(booleanColumn("overseas_illness")),
      overseasLocation: nullable(stringColumn("overseas_location")),
    },
    { schema }
  );
}

// ---------------------------------------------------------------

export interface FirebaseAnalyticsAttributes {
  event_date: string;
  event: any;
}
export function defineFirebaseAnalytics(
  sql: SplitSql
): Model<FirebaseAnalyticsAttributes> {
  return defineModel<FirebaseAnalyticsAttributes>(
    sql.nonPii,
    "firebase_analytics",
    {
      event_date: stringColumn(),
      event: jsonbColumn(),
    },
    { schema }
  );
}

export interface FirebaseAnalyticsTableAttributes {
  name: string;
  modified: number;
}
export function defineFirebaseAnalayticsTable(
  sql: SplitSql
): Model<FirebaseAnalyticsTableAttributes> {
  return defineModel<FirebaseAnalyticsTableAttributes>(
    sql.nonPii,
    "firebase_analytics_table",
    {
      name: unique(stringColumn()),
      modified: bigIntColumn(),
    },
    { schema }
  );
}

// ---------------------------------------------------------------

export interface ExpertReadAttributes {
  surveyId: number;
  interpretation: string;
  interpreterId: number;
}

export function defineExpertRead(sql: SplitSql): Model<ExpertReadAttributes> {
  return defineModel<ExpertReadAttributes>(
    sql.nonPii,
    "expert_read",
    {
      surveyId: unique(integerColumn("surveyId")),
      interpretation: stringColumn("interpretation"),
      interpreterId: integerColumn("interpreterId"),
    },
    { schema }
  );
}
