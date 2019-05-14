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
  SampleInfo,
  PatientInfoGender,
  QuestionInfo,
  QuestionAnswerOption,
  OtherValueInfo
} from "./common";

export {
  ProtocolDocumentBase,
  DeviceInfo,
  SampleInfo,
  PatientInfoGender,
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
  answer: common.AnswerInfo[];
}

export enum DocumentType {
  Survey = "SURVEY",
  Analytics = "ANALYTICS",
  Photo = "PHOTO"
}

export type ProtocolDocument =
  | SurveyDocument
  | AnalyticsDocument
  | PhotoDocument;

// Common to PII and NonPII visit info.
export interface CommonInfo {
  isDemo: boolean;
  marketingProperties?: any;
  events: EventInfo[];
  pushNotificationState?: PushNotificationState;
  workflow: WorkflowInfo;

  // For now, since we collect no PII, I've put this here.  However, if we start
  // collecting all sorts of PII, we might file this into a PatientInfo object.
  // Note that gender isn't considered by GDPR and other standards to be PII
  // (just like birthdate and race).
  gender?: PatientInfoGender;
}

export interface SurveyDocument extends ProtocolDocumentBase {
  documentType: DocumentType.Survey;
  schemaId: 1;
  survey: SurveyInfo;
}

export type SurveyInfo = SurveyNonPIIInfo;

export interface SurveyNonPIIInfo extends CommonInfo {
  consents: NonPIIConsentInfo[];
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

export interface NonPIIConsentInfo {
  terms: string;
  date: string; // date only
  localTime?: string; // FHIR:time
}

export interface WorkflowInfo {
  screeningCompletedAt?: string; // FHIR:instant
  surveyCompletedAt?: string; // FHIR:instant
  surveyStartedAt?: string; // FHIR:instant
  skippedScreeningAt?: string; // FHIR:isntant
  [key: string]: string | undefined;
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
