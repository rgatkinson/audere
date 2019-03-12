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

export interface ProtocolDocumentBase {
  documentType: string;
  schemaId: number;

  // cryptographically secure unique id for this document.
  csruid: string;

  // information about client device
  device: DeviceInfo;
}

export enum DocumentType {
  Survey = "SURVEY",
  Feedback = "FEEDBACK",
  Analytics = "ANALYTICS",
  Photo = "PHOTO",
}

export type ProtocolDocument =
  | SurveyDocument
  | FeedbackDocument
  | AnalyticsDocument
  | PhotoDocument;

export interface DeviceInfo {
  installation: string; // uuid
  clientVersion: string;
  yearClass: string;
  idiomText: string;
  platform: string;
}

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

  // Filtered to include only non-PII, like health data.
  responses: ResponseInfo[];
}

export interface GpsLocationInfo {
  latitude: string;
  longitude: string;
}

export interface PushNotificationState {
  showedSystemPrompt: boolean;
  softResponse?: boolean;
  token?: string;
  registrationError?: PushRegistrationError,
}

export interface PushRegistrationError {
  message: string,
  code: number,
  details: string,
}

// Information about swabs or other physical samples collected during visit
export interface SampleInfo {
  // Possible values TBD
  sample_type: string;
  // Value read from the test kit's QR code, or another unique identifier
  code: string;
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

// The following options come from:
// https://www.hl7.org/fhir/valueset-administrative-gender.html
export enum PatientInfoGender {
  Male = "male",
  Female = "female",
  Other = "other",
  Unknown = "unknown"
}

export interface TelecomInfo {
  system: TelecomInfoSystem;
  value: string;
}

export enum TelecomInfoSystem {
  Phone = "phone",
  SMS = "sms",
  Email = "email"
}

export interface AddressInfo extends AddressValueInfo {
  use: AddressInfoUse;
}

export enum AddressInfoUse {
  Home = "home",
  Work = "work",
  Temp = "temp"
}

export interface NonPIIConsentInfo {
  terms: string;
  signerType: ConsentInfoSignerType;
  date: string; // date only
  localTime?: string; // FHIR:time
  appHash?: string;    // Used primarily to determine consent version (for $)
}

export interface ConsentInfo extends NonPIIConsentInfo {
  firstName?: string;
  lastName?: string;
  signature?: string; // Base64-encoded PNG of the signature
  relation?: string;
}

export enum ConsentInfoSignerType {
  Subject = "Subject",
  Parent = "Parent",
  Representative = "Representative",
  Researcher = "Researcher"
}

export interface WorkflowInfo {
  screeningCompletedAt?: string; // FHIR:instant
  surveyCompletedAt?: string; // FHIR:instant
  surveyStartedAt?: string; // FHIR: instant
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

export interface QuestionInfo {
  // human-readable, locale-independent id of the question
  id: string;
  // localized text of question
  text: string;
  // For multiple-choice questions, the exact text of each option, in order
  answerOptions?: QuestionAnswerOption[];
}

export interface QuestionAnswerOption {
  id: string;
  text: string;
}

export interface AnswerInfo {
  valueBoolean?: boolean;
  valueDateTime?: string; // FHIR:dateTime
  valueDecimal?: number;
  valueInteger?: number;
  valueString?: string;
  valueAddress?: AddressValueInfo;

  // Index in answerOptions of the selected choice
  valueIndex?: number;

  // If the selected option also has a freeform text box, e.g
  // 'Other, please specify: _________'
  valueOther?: OtherValueInfo;

  // True if the patiented declined to respond to the question
  valueDeclined?: boolean;
}

export interface AddressValueInfo {
  firstName?: string;
  lastName?: string;
  line: string[];
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OtherValueInfo {
  // Index in answerOptions of the selected choice
  selectedIndex: Number;
  valueString: string;
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

export interface EventInfo {
  kind: EventInfoKind;

  at: string; // FHIR:instant
  until?: string; // FHIR:instant

  // id of the item this event describes (e.g. question id), if applicable
  refId?: string;
}

export enum EventInfoKind {
  Response = "response",
  Sample = "sample",
  Screening = "screening",
  Survey = "survey",
  AppNav = "appNav",
  TimeoutNav = "timeoutNav",
  Interaction = "interaction",
  Render = "render",
}
