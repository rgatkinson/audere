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
  ProtocolDocumentBase,
  DeviceInfo,
  GpsLocationInfo,
  SampleInfo,
  PatientInfoGender,
  TelecomInfo,
  TelecomInfoSystem,
  AddressInfoUse,
  ConsentInfoSignerType,
  QuestionInfo,
  QuestionAnswerOption,
  OtherValueInfo
} from "./common";

export {
  ProtocolDocumentBase,
  DeviceInfo,
  GpsLocationInfo,
  SampleInfo,
  PatientInfoGender,
  TelecomInfo,
  TelecomInfoSystem,
  AddressInfoUse,
  ConsentInfoSignerType,
  QuestionInfo,
  QuestionAnswerOption,
  OtherValueInfo
};

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
  firstName?: string;
  lastName?: string;
}

export enum DocumentType {
  Survey = "SURVEY",
  Feedback = "FEEDBACK",
  Analytics = "ANALYTICS",
  Photo = "PHOTO"
}

export type ProtocolDocument =
  | SurveyDocument
  | FeedbackDocument
  | AnalyticsDocument
  | PhotoDocument;

// ================================================================================
// Yes, I know, I know, "Personally-Identifiable-Information Info".
// Unfortunately, it fits the pattern, and helps disambiguate.
// Welcome to the department of redundancy department.
export interface PIIInfo extends CommonInfo {
  gps_location?: GpsLocationInfo;
  patient: PatientInfo;
  consents: ConsentInfo[];

  // Filtered to include only PII, like name, email, and address.
  responses: ResponseInfo[];
}

// Common to PII and NonPII visit info.
export interface CommonInfo {
  isDemo: boolean;
  marketingProperties?: any;
  events: EventInfo[];
  pushNotificationState?: PushNotificationState;
  workflow: WorkflowInfo;
}

export interface SurveyDocument extends ProtocolDocumentBase {
  documentType: DocumentType.Survey;
  schemaId: 1;
  survey: SurveyInfo;
}

export type SurveyInfo = PIIInfo & SurveyNonPIIInfo;

// This is not part of the protocol, but represents anonymized state
// for the purposes of analytics we save in the non-PII database.
export interface SurveyNonPIIDbInfo extends SurveyNonPIIInfo {
  consents: NonPIIConsentInfo[];
}

export interface SurveyNonPIIInfo extends CommonInfo {
  samples: SampleInfo[];

  invalidBarcodes?: SampleInfo[];

  // Filtered to include only non-PII, like health data.
  responses: ResponseInfo[];
}

export interface PushNotificationState {
  showedSystemPrompt: boolean;
  softResponse?: boolean;
  token?: string;
  registrationError?: PushRegistrationError;
}

export interface PushRegistrationError {
  message: string;
  code: number;
  details: string;
}

// This is a subset of the FHIR 'Patient' resource
// https://www.hl7.org/fhir/patient.html
export interface PatientInfo {
  firstName?: string;
  lastName?: string;
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
  localTime?: string; // FHIR:time
  appBuild?: string; // Used primarily to determine consent version (for $)
}

export interface ConsentInfo extends NonPIIConsentInfo {
  firstName?: string;
  lastName?: string;
  signature?: string; // Base64-encoded PNG of the signature
  relation?: string;
}

export interface WorkflowInfo {
  screeningCompletedAt?: string; // FHIR:instant
  surveyCompletedAt?: string; // FHIR:instant
  surveyStartedAt?: string; // FHIR:instant
  skippedScreeningAt?: string; // FHIR:isntant
  [key: string]: string | undefined;
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
// Analytics

export interface AnalyticsDocument extends ProtocolDocumentBase {
  documentType: DocumentType.Analytics;
  schemaId: 1;
  analytics: AnalyticsInfo;
}

export interface AnalyticsInfo {
  timestamp: string;
  logs: LogRecordInfo[];
  events: EventInfo[];
  crash?: string;
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
  Fatal = "FATAL"
}

// ================================================================================
// Photo

export interface PhotoDocument extends ProtocolDocumentBase {
  documentType: DocumentType.Photo;
  schemaId: 1;
  photo: PhotoInfo;
}

export interface PhotoInfo {
  timestamp: string;
  jpegBase64: string;
}

// ================================================================================
// EventInfo

export interface EventInfo extends common.EventInfo {
  kind: EventInfoKind;
}

export enum EventInfoKind {
  Response = "response",
  Sample = "sample",
  Screening = "screening",
  Survey = "survey",
  AppNav = "appNav",
  TimeoutNav = "timeoutNav",
  Interaction = "interaction",
  Render = "render"
}
