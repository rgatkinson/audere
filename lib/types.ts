// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export enum DocumentType {
  Visit = 'VISIT',
  Feedback = 'FEEDBACK',
  Log = 'LOG',
}

export interface VisitDocument {
  // cryptographically secure unique id for this document.
  csruid: string;

  documentType: DocumentType.Visit;

  // information about client device
  device: DeviceInfo;

  // clinical data related to the visit
  visit: VisitInfo;
}

export interface DeviceInfo {
  installation: string; // uuid
  clientVersion: string;
  deviceName: string;
  yearClass: string;
  idiomText: string;
  platform: string;
}

export interface VisitInfo {
  complete: boolean;
  gps_location?: GpsLocationInfo;
  location?: string;
  samples: SampleInfo[];
  patient: PatientInfo;
  consents: ConsentInfo[];
  responses: ResponseInfo[];
  events: EventInfo[];
}

export interface GpsLocationInfo {
  latitude: string;
  longitude: string;
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
  name?: string;
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
  Unknown = "unknown",
}

export interface TelecomInfo {
  system: TelecomInfoSystem;
  value: string;
}

export enum TelecomInfoSystem {
  Phone = "phone",
  SMS = "sms",
  Email = "email",
}

export interface AddressInfo extends AddressValueInfo {
  use: AddressInfoUse;
}

export enum AddressInfoUse {
  Home = "home",
  Work = "work",
}

export interface ConsentInfo {
    name: string;
    terms: string;
    signerType: ConsentInfoSignerType;
    date: string; // date only
    signature: string; // Base64-encoded PNG of the signature
}

export enum ConsentInfoSignerType {
  Subject = "Subject",
  Parent = "Parent",
  Representative = "Representative",
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

  // If the selected option also has a freeform text box, e.g
  // 'Other, please specify: _________'
  valueOther?: OtherValueInfo;

  // True if the patiented declined to respond to the question
  valueDeclined?: boolean;
}

export interface AddressValueInfo {
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

export interface EventInfo {
  kind: EventInfoKind;

  at: string; // FHIR:instant
  until: string; // FHIR:instant

  // id of the item this event describes (e.g. question id), if applicable
  refId?: string;
}

export enum EventInfoKind {
  Visit = "visit",
  Response = "response",
  Sample = "sample",
}
