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
  DeviceInfo,
  SampleInfo,
  PatientInfoGender,
  QuestionInfo,
  QuestionAnswerOption,
  OtherValueInfo
} from "./common";

export {
  DeviceInfo,
  SampleInfo,
  PatientInfoGender,
  QuestionInfo,
  QuestionAnswerOption,
  OtherValueInfo
};

export interface ProtocolDocumentBase {
  documentType: string;
  schemaId: number;

  // unique id for this document.
  docId: string;

  // information about client device
  device: DeviceInfo;
}

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
  Photo = "PHOTO"
}

export type ProtocolDocument = SurveyDocument | PhotoDocument;

export type TransportMetadata = {
  sentAt: string;
  receivedAt?: string;
  contentHash: string;
  lastWriter: "sender" | "receiver";
  protocolVersion: number;
};

export type FirestoreProtocolDocument = ProtocolDocument & {
  _transport: TransportMetadata;
};

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

  rdtInfo?: RDTInfo;
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
// Photo

export interface PhotoDocument extends ProtocolDocumentBase {
  documentType: DocumentType.Photo;
  schemaId: 1;
  photo: PhotoInfo;
}

export interface PhotoInfo {
  timestamp: string;
  photoId: string;
}

export interface PhotoDbInfo extends PhotoInfo {
  jpegBase64: string;
}

// ================================================================================
// EventInfo

export interface EventInfo extends common.EventInfo {
  kind: EventInfoKind;
}

export enum EventInfoKind {
  AppNav = "appNav",
  TimeoutNav = "timeoutNav",
  Render = "render"
}

// ================================================================================
// RDTReader

export interface RDTInfo {
  rdtReaderResult?: RDTReaderResult;
  totalTestStripTime?: number;
  captureTime?: number;
  rdtTotalTime?: number;

  // Other RDT reader information can go here:
  //  e.g. time taken to capture, length of time test strip was in solution, etc.
}

export interface RDTReaderResult {
  testStripFound: boolean;
  skippedDueToMemWarning?: boolean;
  isCentered?: boolean;
  sizeResult?: RDTReaderSizeResult;
  isFocused?: boolean;
  angle?: number;
  isRightOrientation?: boolean;
  exposureResult?: RDTReaderExposureResult;
  controlLineFound?: boolean;
  testALineFound?: boolean;
  testBLineFound?: boolean;
}

// Must be kept in sync with native RDTReader/ImageProcessor.h
export enum RDTReaderExposureResult {
  UNDER_EXPOSED,
  NORMAL,
  OVER_EXPOSED
}

// Must be kept in sync with native RDTReader/ImageProcessor.h
export enum RDTReaderSizeResult {
  RIGHT_SIZE,
  LARGE,
  SMALL,
  INVALID
}
