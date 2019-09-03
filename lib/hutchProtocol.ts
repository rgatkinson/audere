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

import { LocationType } from "./locations";

// Any changes to the Encounter interface should increment the schema version.
//
// MAJOR.MINOR.PATCH
//
// MAJOR should increment when there is an incompatible or breaking change.
// MINOR should increment when fields are added in a backwards compatible way.
// PATCH should increment when there is a backward-compatible bug fix.
export const schemaVersion: string = "1.1.0";

// --------------------------------------------------------------------------
// This defines types for the JSON body uploaded to the Hutch endpoint to
// to transmit data about a single participant encounter during the study.

// Represents an encounter with a study participant.
//
// A repeat swab is represented as a separate encounter that has a shorter
// list of responses, but otherwise the same set of metadata.
export interface Encounter {
  // Opaque unique id (<1k) that persistently identifies this Encounter
  // record.
  //
  // Implementation note: This will likely be a standard uuid.
  id: string;

  // Opaque unique identifier (<1k) that persistently identifies the
  // participant involved in this encounter.
  //
  // Implementation note: This will likely be a sha256 of {name,DOB,secret},
  // where secret is a cryptographically secure random string held privately
  // in the Audere database.
  participant: string;

  // Identifier for the JSON schema version expressed using semantic versioning.
  // Will contain numeric values for MAJOR, MINOR, and PATCH in the form of
  // MAJOR.MINOR.PATCH. Can be used to track data issues to a schema version.
  schemaVersion: string;

  // Build info version. Can be used to track data issues to a build version.
  revision: string;

  // Currently English (en) or Spanish (es), this will be the standard language
  // code of the localized language used in the encounter.
  localeLanguageCode: "en" | "es";

  // ISO-8601 UTC date/time at the beginning of the encounter,
  // e.g. "2018-11-06T18:22Z".
  startTimestamp: string;

  // Name of the site where the encounter occurred.  In the app, this is
  // in admin settings.  This is optional because it will not be available
  // when the encounter is completed via a user's personal device.
  site?: Site;

  // De-identified location information.
  locations: Location[];

  sampleCodes: SampleCode[];
  responses: Response[];

  events: Event[];

  // Participant's age when compared to the current time during report
  // generation.  If the survey lacks a valid birth date then age will not be
  // supplied.
  age?: Age;
}

export interface Age {
  value?: number;
  ninetyOrAbove: boolean;
}

export interface Event {
  time: string;
  eventType: EventType;
}

export enum EventType {
  BarcodeScanned = "BarcodeScanned",
  ConsentSigned = "ConsentSigned",
  StartedQuestionnaire = "StartedQuestionnaire",
  SymptomsScreened = "SymptomsScreened",
}

export enum LocationUse {
  Home = "Home",
  Work = "Work",
  Temp = "Temp",
}

export interface Site {
  type: LocationType;
  name: string;
}

export interface Location {
  use: LocationUse;

  // Opaque string that corresponds to a particular address, but that cannot be
  // mapped back to that address.
  //
  // Implementation note: This will likely be a sha256 of the canonicalized
  // address along with a cryptographically secure random string held privately
  // in the Audere database.
  id: string;

  // Region containing to the home address, if given.  Two encounters with home
  // addresses in the same region will have the same string value here.
  // This is expected to be census tract, but exact format is TBD.
  region: string;

  city: string;

  state: string;
}

export enum SampleType {
  StripPhoto = "StripPhoto",
  ManualSelfSwab = "ManualSelfSwab",
  ScannedSelfSwab = "ScannedSelfSwab",
  ClinicSwab = "ClinicSwab",
  Blood = "Blood",
  Serum = "Serum",
  PBMC = "PBMC",
}

// The value of a barcode/QR-code from a sample collection container.
export interface SampleCode {
  // This is a non-localized identifier that can be used programmatically to
  // tag the sample type.  These identifiers are semantically meaningful and
  // will never change, though new identifiers could be added over time.
  type: SampleType;

  // The text of the code scanned from the label on the container.
  // Currently this is a short hexadecimal number.
  code: string;
}

// A question asked on the survey, and the participant's response.
export interface Response {
  question: LocalText;

  // If multiple-choice, localized text of the options presented.
  // Only present when multiple-choice.  Selected options are specified
  // by index(es) into this array.
  options?: LocalText[];

  answer: Answer;
}

export type Answer =
  | StringAnswer
  | NumberAnswer
  | OptionAnswer
  | DeclinedToAnswer;

export interface StringAnswer {
  type: "String";
  value: string;
}

export interface NumberAnswer {
  type: "Number";
  value: number;
}

export interface OptionAnswer {
  type: "Option";

  // Index(es) into options array that were chosen by the participant.
  // In this case, Response.options is guaranteed to be non-empty.
  chosenOptions: number[];
}

export interface DeclinedToAnswer {
  type: "Declined";
}

export interface LocalText {
  // A short, human-readable token used by Audere for localization, used
  // by Hutch as a hint as the survey evolves over time that text on
  // one survey might be semantically equivalent or similar to text
  // with the same token on a different version of the survey.
  token: string;

  // Exact localized text that the participant sees on the screen, including
  // any punctuation, but without a trailing newline.
  text: string;
}
