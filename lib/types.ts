// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export enum DocumentType {
  Visit = 'VISIT',
  Feedback = 'FEEDBACK',
  Log = 'LOG',
}

export type VisitDocument = {
  // cryptographically secure unique id for this document.
  csruid: string;

  documentType: DocumentType.Visit;

  // information about client device
  device: DeviceInfo;

  // clinical data related to the visit
  visit: VisitInfo;
}

export type DeviceInfo = {
  installation: string; // uuid
  clientVersion: string;
  deviceName: string;
  yearClass: string;
  idiomText: string;
  platform: string;
}

export type VisitInfo = {
  complete: boolean;
  gps_location?: GpsLocationInfo;
  location?: string;
  samples: SampleInfo[];
  patient: PatientInfo;
  consent: ConsentInfo;
  responses: ResponseInfo[];
  events: EventInfo[];
}

export type GpsLocationInfo = {
  latitude: string;
  longitude: string;
}

// Information about swabs or other physical samples collected during visit
export type SampleInfo = {
  // Possible values TBD
  sample_type: string;
  // Value read from the test kit's QR code, or another unique identifier
  code: string;
}

// This is a subset of the FHIR 'Patient' resource
// https://www.hl7.org/fhir/patient.html
export type PatientInfo = {
  name: string;
  birthDate: string; // FHIR:date

  // The following options come from:
  // https://www.hl7.org/fhir/valueset-administrative-gender.html
  gender: "male" | "female" | "other" | "unknown";

  telecom: TelecomInfo[];
  address: AddressInfo[];
}

export type TelecomInfo = {
  system: "phone" | "sms" | "email";
  value: string;
}

export type AddressInfo = {
  use: "home" | "work";
  line: string[];
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type ConsentInfo = {
  terms: string;
  name: string;
  signerType: "Subject" | "Parent" | "Representative";
  date: string; // date only
  signature: string; // Base64-encoded PNG of the signature
}

// This is loosely based on the FHIR 'QuestionnaireResponse' resource
// https://www.hl7.org/fhir/questionnaireresponse.html
export type ResponseInfo = {
  id: string;
  item: ResponseItemInfo[];
}

export type ResponseItemInfo = QuestionInfo & { answer: AnswerInfo[]; }

export type QuestionInfo = {
  // human-readable, locale-independent id of the question
  id: string;
  // localized text of question
  text: string;
  // For multiple-choice questions, the exact text of each option, in order
  answerOptions?: QuestionAnswerOption[];
}

export type QuestionAnswerOption = {
  id: string;
  text: string;
}

export type AnswerInfo = {
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

export type AddressValueInfo = {
  line: [string];
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type OtherValueInfo = {
  // Index in answerOptions of the selected choice
  selectedIndex: Number;
  valueString: string;
}

export type EventInfo = {
  kind: "visit" | "response" | "sample";

  at: string; // FHIR:instant
  until: string; // FHIR:instant

  // id of the item this event describes (e.g. question id), if applicable
  refId?: string;
}