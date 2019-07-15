// Copyright (c) 2019 Audere
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

export interface ProtocolDocumentBase {
  documentType: string;
  schemaId: number;

  // cryptographically secure unique id for this document.
  csruid: string;

  // information about client device
  device: DeviceInfo;
}

export interface DeviceInfo {
  installation: string; // uuid
  clientVersion: ClientVersionInfo;
  deviceName?: string;
  yearClass: string;
  idiomText: string;
  platform: string;
}

export interface ClientVersionInfo {
  buildDate: string;
  hash: string;
  name: string;
  version: string;
}

export interface GpsLocationInfo {
  latitude: string;
  longitude: string;
}

export interface EventInfo {
  at: string; // FHIR:instant
  until?: string; // FHIR:instant

  // id of the item this event describes (e.g. question id), if applicable
  refId?: string;
}

// Information about swabs or other physical samples collected during visit
export interface SampleInfo {
  // Possible values TBD
  sample_type: string;
  // Value read from the test kit's QR code, or another unique identifier
  code: string;
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

export enum AddressInfoUse {
  Home = "home",
  Work = "work",
  Temp = "temp"
}

export interface AddressInfo {
  line: string[];
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export enum ConsentInfoSignerType {
  Subject = "Subject",
  Parent = "Parent",
  Representative = "Representative",
  Researcher = "Researcher"
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

// This is loosely based on the FHIR 'QuestionnaireResponse' resource
// https://www.hl7.org/fhir/questionnaireresponse.html
export interface ResponseInfo {
  id: string;
  item: ResponseItemInfo[];
}

export interface ResponseItemInfo extends QuestionInfo {
  answer: AnswerInfo[];
}

export interface AnswerValueInfo extends AnswerInfo {
  valueAddress?: AddressInfo;
}

export interface AnswerInfo {
  valueBoolean?: boolean;
  valueDateTime?: string; // FHIR:dateTime
  valueDecimal?: number;
  valueInteger?: number;
  valueString?: string;

  // Index in answerOptions of the selected choice
  valueIndex?: number;

  // If the selected option also has a freeform text box, e.g
  // 'Other, please specify: _________'
  valueOther?: OtherValueInfo;

  // True if the patiented declined to respond to the question
  valueDeclined?: boolean;
}

export interface OtherValueInfo {
  // Index in answerOptions of the selected choice
  selectedIndex: Number;
  valueString: string;
}
