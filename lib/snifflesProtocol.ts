// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// ========================================================================
//
// PLEASE NOTE:
//
// If you need to change types here sometime after we store real data:
// Because these types are used across client/server, we have to maintain
// compatibility.  The two ways of doing this are:
//   1) Add a new optional field.
//   2) Bump the top-level schemaId, and create a new version of each
//      container type from the modified type up to the root of the
//      containment tree.
//
// ========================================================================

import * as common from "./common";

import {
  ClientVersionInfo,
  GpsLocationInfo,
  SampleInfo,
  PatientInfoGender,
  TelecomInfo,
  TelecomInfoSystem,
  AddressInfoUse,
  ConsentInfoSignerType,
  QuestionInfo,
  QuestionAnswerOption,
  OtherValueInfo,
} from "./common";

export {
  ClientVersionInfo,
  GpsLocationInfo,
  SampleInfo,
  PatientInfoGender,
  TelecomInfo,
  TelecomInfoSystem,
  AddressInfoUse,
  ConsentInfoSignerType,
  QuestionInfo,
  QuestionAnswerOption,
  OtherValueInfo,
};

export interface ProtocolDocumentBase {
  documentType: string;
  schemaId: number;

  // cryptographically secure unique id for this document.
  csruid: string;

  // information about client device
  device: DeviceInfo;
}

export interface DeviceInfo {
  installation: string;
  clientVersion: ClientVersionInfo;
  deviceName: string;
  yearClass: string;
  idiomText: string;
  platform: string;
}

// This is loosely based on the FHIR 'QuestionnaireResponse' resource
// https://www.hl7.org/fhir/questionnaireresponse.html
export interface ResponseInfo {
  id: string;
  item: ResponseItemInfo[];
}

export interface ResponseItemInfo extends QuestionInfo {
  answer: AnswerInfo[];
}

export interface AnswerInfo extends common.AnswerInfo {
  valueAddress?: AddressValueInfo;
}

export interface AddressValueInfo extends common.AddressInfo {
  name?: string;
}

export enum DocumentType {
  Visit = "VISIT",
  Feedback = "FEEDBACK",
  Log = "LOG", // only used for crash logs
  LogBatch = "LOG_BATCH",
  Backup = "BACKUP",
}

export type ProtocolDocument =
  | FeedbackDocument
  | LogDocument
  | VisitDocument
  | LogBatchDocument
  | BackupDocument;

// ================================================================================
// Visit

export interface VisitDocument extends ProtocolDocumentBase {
  documentType: DocumentType.Visit;
  schemaId: 1;
  visit: VisitInfo;
}

export type VisitInfo = VisitPIIInfo & VisitNonPIIInfo;

// Yes, I know, I know, "Personally-Identifiable-Information Info".
// Unfortunately, it fits the pattern, and helps disambiguate.
// Welcome to the department of redundancy department.
export interface VisitPIIInfo extends VisitCommonInfo {
  gps_location?: GpsLocationInfo;
  patient: PatientInfo;
  consents: ConsentInfo[];

  // Filtered to include only PII, like name, email, and address.
  responses: ResponseInfo[];
}

// This is not part of the protocol, but represents anonymized state
// for the purposes of analytics we save in the non-PII database.
export interface VisitNonPIIDbInfo extends VisitNonPIIInfo {
  consents: NonPIIConsentInfo[];
}

export interface VisitNonPIIInfo extends VisitCommonInfo {
  samples: SampleInfo[];
  giftcards: GiftCardInfo[];

  // Filtered to include only non-PII, like health data.
  responses: ResponseInfo[];
}

// Common to PII and NonPII visit info.
export interface VisitCommonInfo {
  complete: boolean;
  isDemo?: boolean;
  location?: string;
  administrator?: string;
  events: EventInfo[];
}

// Information about gift cards given to participants
export interface GiftCardInfo {
  barcodeType: string;
  code: string;
  giftcardType: string;
}

// This is a subset of the FHIR 'Patient' resource
// https://www.hl7.org/fhir/patient.html
export interface PatientInfo {
  name?: string;
  birthDate?: string; // FHIR:date
  gender?: PatientInfoGender;
  telecom: TelecomInfo[];
  address: AddressInfo[];
}

export interface AddressInfo extends AddressValueInfo {
  use: AddressInfoUse;
}

export interface NonPIIConsentInfo {
  terms: string;
  signerType: ConsentInfoSignerType;
  date: string; // date only
  relation?: string;
  localTime?: string; // FHIR:time
}

export interface ConsentInfo extends NonPIIConsentInfo {
  name: string;
  signature: string; // Base64-encoded PNG of the signature
}

export interface EventInfo extends common.EventInfo {
  kind: EventInfoKind;
}

export enum EventInfoKind {
  Visit = "visit",
  Response = "response",
  Sample = "sample",
}

// ================================================================================
// Feedback

export interface FeedbackDocument extends ProtocolDocumentBase {
  documentType: DocumentType.Feedback;
  schemaId: 1;
  feedback: FeedbackInfo;
}

export interface FeedbackInfo {
  subject: string;
  body: string;
}

// ================================================================================
// Log - deprecated except for crash logs

export interface LogDocument extends ProtocolDocumentBase {
  documentType: DocumentType.Log;
  schemaId: 1;
  log: LogInfo;
}

export enum LogLevel {
  Info = 1,
  Warn = 2,
  Error = 3,
  Fatal = 4,
}

export interface LogInfo {
  logentry: string;
  level: LogLevel;
}

// ================================================================================
// LogBatch

export interface LogBatchDocument extends ProtocolDocumentBase {
  documentType: DocumentType.LogBatch;
  schemaId: 1;
  batch: LogBatchInfo;
}

export interface LogBatchInfo {
  timestamp: string;
  records: LogRecordInfo[];
}

export interface LogRecordInfo {
  timestamp: string;
  level: LogRecordLevel;
  text: string;
}

export enum LogRecordLevel {
  Debug = "DEBUG",
  Info = "INFO",
  Warn = "WARN",
  Error = "ERROR",
  Fatal = "FATAL",
}

export interface BackupDocument extends ProtocolDocumentBase {
  documentType: DocumentType.Backup;
  schemaId: 1;
  visit: VisitInfo;
}
