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

export function defineChillsModels(sql: SplitSql): ChillsModels {
  const models: ChillsModels = {
    accessKey: defineAccessKey(sql),
    clinicalSurveillance: defineClinicalSurveillance(sql),
    expertRead: defineExpertRead(sql),
    firebaseAnalytics: defineFirebaseAnalytics(sql),
    iliNetSurveillance: defineILINetSurveillance(sql),
    firebaseAnalyticsTable: defineFirebaseAnalayticsTable(sql),
    importProblem: defineImportProblem(sql),
    matchedKits: defineMatchedKits(sql),
    mtlFiles: defineMTLFile(sql),
    mtlReports: defineMTLReport(sql),
    photo: definePhoto(sql),
    photoReplacementLog: definePhotoReplacementLog(sql),
    photoUploadLog: definePhotoUploadLog(sql),
    rdtPreview: defineRDTPreview(sql),
    shippedKits: defineShippedKits(sql),
    survey: defineSurvey(sql.nonPii),
    triggers: defineEvidationTrigger(sql),
    virenaFile: defineVirenaFile(sql),
    virenaRecord: defineVirenaRecord(sql),
  };

  models.survey.hasOne(models.photoUploadLog, {
    foreignKey: "chills_survey_id",
    onDelete: "CASCADE",
  });
  models.survey.hasOne(models.expertRead, {
    foreignKey: "surveyId",
    onDelete: "CASCADE",
  });
  models.virenaFile.hasMany(models.virenaRecord, {
    foreignKey: "file_id",
    onDelete: "CASCADE",
  });

  return models;
}

export interface ChillsModels {
  accessKey: Model<AccessKeyAttributes>;
  clinicalSurveillance: Model<ClinicalSurveillanceAttributes>;
  expertRead: Model<ExpertReadAttributes>;
  firebaseAnalytics: Model<FirebaseAnalyticsAttributes>;
  firebaseAnalyticsTable: Model<FirebaseAnalyticsTableAttributes>;
  iliNetSurveillance: Model<ILINetSurveillanceAttributes>;
  importProblem: Model<ImportProblemAttributes>;
  matchedKits: Model<MatchedKitAttributes>;
  mtlFiles: Model<MTLFileAttributes>;
  mtlReports: Model<MTLReportAttributes>;
  photo: Model<PhotoAttributes>;
  photoReplacementLog: Model<PhotoReplacementLogAttributes>;
  photoUploadLog: Model<PhotoUploadLogAttributes>;
  rdtPreview: Model<ChillsRDTPreviewAttributes>;
  shippedKits: Model<ShippedKitAttributes>;
  survey: Model<SurveyAttributes<SurveyNonPIIInfo>>;
  triggers: Model<EvidationTriggerAttributes>;
  virenaFile: Model<VirenaFileAttributes>;
  virenaRecord: Model<VirenaRecordAttributes>;
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

export interface AccessKeyAttributes {
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
  surveyId: string;
}
export function definePhotoUploadLog(
  sql: SplitSql
): Model<PhotoUploadLogAttributes> {
  return defineModel<PhotoUploadLogAttributes>(
    sql.nonPii,
    "photo_upload_log",
    {
      surveyId: unique(stringColumn("chills_survey_id")),
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
  expert_read?: ExpertReadAttributes;
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

// ---------------------------------------------------------------

export interface PhotoReplacementLogAttributes {
  photoId: number;
  oldPhotoHash: string;
  newPhotoHash: string;
  replacerId: number;
}

export function definePhotoReplacementLog(
  sql: SplitSql
): Model<PhotoReplacementLogAttributes> {
  return defineModel<PhotoReplacementLogAttributes>(
    sql.nonPii,
    "photo_replacement_log",
    {
      photoId: unique(integerColumn("photoId")),
      oldPhotoHash: stringColumn("oldPhotoHash"),
      newPhotoHash: stringColumn("newPhotoHash"),
      replacerId: unique(integerColumn("replacerId")),
    },
    { schema }
  );
}

// ---------------------------------------------------------------

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

export interface ShippedKitAttributes {
  id?: number;
  evidationId: string;
  barcode: string;
  email: string;
  birthdate: string;
  sex: string;
  city: string;
  state: string;
  postalCode: string;
  orderedAt: string;
  demo: boolean;
}

export function defineShippedKits(sql: SplitSql) {
  return defineModel<ShippedKitAttributes>(
    sql.nonPii,
    "shipped_kits",
    {
      evidationId: stringColumn("evidation_id"),
      barcode: stringColumn(),
      email: stringColumn("email"),
      birthdate: stringColumn("birthdate"),
      sex: stringColumn("sex"),
      city: stringColumn("city"),
      state: stringColumn("state"),
      postalCode: stringColumn("postal_code"),
      orderedAt: stringColumn("ordered_at"),
      demo: booleanColumn(),
    },
    { schema }
  );
}

export interface MatchedKitAttributes {
  id?: number;
  barcode: string;
  identifier: string;
}

export function defineMatchedKits(sql: SplitSql) {
  return defineModel<MatchedKitAttributes>(
    sql.nonPii,
    "matched_kits",
    {
      barcode: stringColumn(),
      identifier: stringColumn(),
    },
    { schema }
  );
}

// ---------------------------------------------------------------

export interface VirenaFileAttributes {
  id?: number;
  key: string;
  hash: string;
  loaded: boolean;
  nextRow?: number;
}
export function defineVirenaFile(sql: SplitSql): Model<VirenaFileAttributes> {
  return defineModel<VirenaFileAttributes>(
    sql.nonPii,
    "virena_files",
    {
      key: unique(stringColumn()),
      hash: stringColumn(),
      loaded: booleanColumn(),
      nextRow: nullable(integerColumn("next_row")),
    },
    { schema }
  );
}

export interface VirenaRecordAttributes {
  fileId?: number;
  serialNumber: string;
  testDate: string;
  facility: string;
  city: string;
  state: string;
  zip: string;
  patientAge: string;
  result1: boolean;
  result2: boolean;
  overallResult: boolean;
  county: string;
  facilityDescription: string;
}
export function defineVirenaRecord(
  sql: SplitSql
): Model<VirenaRecordAttributes> {
  return defineModel<VirenaRecordAttributes>(
    sql.nonPii,
    "virena_records",
    {
      fileId: integerColumn("file_id"),
      serialNumber: stringColumn("serial_number"),
      testDate: stringColumn("test_date"),
      facility: stringColumn(),
      city: stringColumn(),
      state: stringColumn(),
      zip: stringColumn(),
      patientAge: stringColumn("patient_age"),
      result1: booleanColumn(),
      result2: booleanColumn(),
      overallResult: booleanColumn("overall_result"),
      county: stringColumn(),
      facilityDescription: stringColumn("facility_description"),
    },
    { schema }
  );
}

// ---------------------------------------------------------------

export interface ClinicalSurveillanceAttributes {
  state: string;
  year: number;
  week: number;
  specimens: number;
  aPositive: number;
  bPositive: number;
}
export function defineClinicalSurveillance(
  sql: SplitSql
): Model<ClinicalSurveillanceAttributes> {
  return defineModel<ClinicalSurveillanceAttributes>(
    sql.nonPii,
    "cdc_clinical",
    {
      state: stringColumn(),
      year: integerColumn(),
      week: integerColumn(),
      specimens: integerColumn("total_specimens"),
      aPositive: integerColumn("total_a"),
      bPositive: integerColumn("total_b"),
    },
    {
      schema,
      indexes: [
        {
          unique: true,
          fields: ["state", "year", "week"],
        },
      ],
    }
  );
}

export interface ILINetSurveillanceAttributes {
  state: string;
  year: number;
  week: number;
  patients: number;
  providers: number;
  positive: number;
}
export function defineILINetSurveillance(
  sql: SplitSql
): Model<ILINetSurveillanceAttributes> {
  return defineModel<ILINetSurveillanceAttributes>(
    sql.nonPii,
    "cdc_ilinet",
    {
      state: stringColumn(),
      year: integerColumn(),
      week: integerColumn(),
      patients: integerColumn("total_patients"),
      providers: integerColumn(),
      positive: integerColumn("total_ili"),
    },
    {
      schema,
      indexes: [
        {
          unique: true,
          fields: ["state", "year", "week"],
        },
      ],
    }
  );
}

// ---------------------------------------------------------------

export interface MTLFileAttributes {
  key: string;
  hash: string;
  orderId?: string;
  orderState?: string;
}
export function defineMTLFile(sql: SplitSql): Model<MTLFileAttributes> {
  return defineModel<MTLFileAttributes>(
    sql.nonPii,
    "mtl_files",
    {
      key: unique(stringColumn()),
      hash: stringColumn(),
      orderId: nullable(stringColumn("order_id")),
      orderState: nullable(stringColumn("order_state")),
    },
    { schema }
  );
}

export interface MTLReportAttributes {
  orderId: string;
  shipped?: boolean;
  received?: boolean;
  processing?: boolean;
  processed?: boolean;
  rejected?: boolean;
  evidationId?: string;
  outboundBarcode?: string;
  inboundBarcode?: string;
  shippedTimestamp?: string;
  receivedTimestamp?: string;
  kitRegistrationCode?: string;
  stripTempStatus?: string;
  rejectionReason?: string;
  fluAResult?: boolean;
  fluAValue?: number;
  fluAAssayTimestamp?: string;
  fluBResult?: boolean;
  fluBValue?: number;
  fluBAssayTimestamp?: string;
  rsvResult?: boolean;
  rsvValue?: number;
  rsvAssayTimestamp?: string;
}
export function defineMTLReport(sql: SplitSql): Model<MTLReportAttributes> {
  return defineModel<MTLReportAttributes>(
    sql.nonPii,
    "mtl_reports",
    {
      orderId: unique(stringColumn("order_id")),
      shipped: booleanColumn(),
      received: booleanColumn(),
      processing: booleanColumn(),
      processed: booleanColumn(),
      rejected: booleanColumn(),
      evidationId: nullable(stringColumn("evidation_id")),
      outboundBarcode: nullable(stringColumn("outbound_barcode")),
      inboundBarcode: nullable(stringColumn("inbound_barcode")),
      shippedTimestamp: nullable(stringColumn("shipped_timestamp")),
      receivedTimestamp: nullable(stringColumn("received_timestamp")),
      kitRegistrationCode: nullable(stringColumn("kit_registration_code")),
      stripTempStatus: nullable(stringColumn("strip_temp_status")),
      rejectionReason: nullable(stringColumn("rejection_reason")),
      fluAResult: nullable(booleanColumn("flu_a_result")),
      fluAValue: nullable(integerColumn("flu_a_value")),
      fluAAssayTimestamp: nullable(stringColumn("flu_a_assay_timestamp")),
      fluBResult: nullable(booleanColumn("flu_b_result")),
      fluBValue: nullable(floatColumn("flu_b_value")),
      fluBAssayTimestamp: nullable(stringColumn("flu_b_assay_timestamp")),
      rsvResult: nullable(booleanColumn("rsv_result")),
      rsvValue: nullable(floatColumn("rsv_value")),
      rsvAssayTimestamp: nullable(stringColumn("rsv_assay_timestamp")),
    },
    { schema }
  );
}

// ---------------------------------------------------------------

export interface EvidationTriggerAttributes {
  evidationId: string;
  triggerDate: string;
}
export function defineEvidationTrigger(
  sql: SplitSql
): Model<EvidationTriggerAttributes> {
  return defineModel<EvidationTriggerAttributes>(
    sql.nonPii,
    "evidation_triggers",
    {
      evidationId: unique(stringColumn("evidation_id")),
      triggerDate: stringColumn("trigger_date"),
    },
    { schema }
  );
}

// ---------------------------------------------------------------

export interface ChillsRDTPreviewAttributes {
  docId: string;
  photo: string;
  seriesIndex: number;
  frameIndex: number;
  previewSampleRate: number;
  uiMessage: string;
  failureReason: string;
  photoUploaded: boolean;
  previewPhotoId: string;
  isFocused: boolean;
  isSteady: boolean;
  isCentered: boolean;
  testStripDetected: boolean;
  controlLineFound: boolean;
  testALineFound: boolean;
  testBLineFound: boolean;
  sharpnessRaw: number;
  exposureResult: number;
  phase1Recognitions: string;
  phase2Recognitions: string;
  intermediateResults: string;
  testStripBoundary: string;
}
export function defineRDTPreview(
  sql: SplitSql
): Model<ChillsRDTPreviewAttributes> {
  return defineModel<ChillsRDTPreviewAttributes>(
    sql.nonPii,
    "rdt_preview_frames",
    {
      docId: stringColumn("docid"),
      photo: stringColumn("photo"),
      seriesIndex: integerColumn("series_index"),
      frameIndex: integerColumn("frame_index"),
      previewSampleRate: integerColumn("preview_sample_rate"),
      uiMessage: nullable(stringColumn("ui_message")),
      failureReason: nullable(stringColumn("failure_reason")),
      photoUploaded: nullable(booleanColumn("photo_uploaded")),
      previewPhotoId: nullable(stringColumn("preview_photo_id")),
      isFocused: nullable(booleanColumn("is_focused")),
      isSteady: nullable(booleanColumn("is_steady")),
      isCentered: nullable(booleanColumn("is_centered")),
      testStripDetected: nullable(booleanColumn("test_strip_detected")),
      controlLineFound: nullable(booleanColumn("control_line_found")),
      testALineFound: nullable(booleanColumn("test_a_line_found")),
      testBLineFound: nullable(booleanColumn("test_b_line_found")),
      sharpnessRaw: nullable(floatColumn("ssharpness_raw")),
      exposureResult: nullable(integerColumn("exposure_result")),
      phase1Recognitions: nullable(stringColumn("phase_1_recognitions")),
      phase2Recognitions: nullable(stringColumn("phase_2_recognitions")),
      intermediateResults: nullable(stringColumn("intermediate_results")),
      testStripBoundary: nullable(stringColumn("test_strip_boundary")),
    },
    { schema }
  );
}
