// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Location } from "audere-lib/hutchProtocol";
import {
  AddressInfoUse,
  AddressInfo,
  EventInfo,
  PatientInfoGender,
  ResponseInfo,
  SampleInfo,
} from "audere-lib/common";
import { FollowUpSurveyData } from "../external/redCapClient";

export interface AddressDetails {
  use: AddressInfoUse;
  value: AddressInfo;
}

export interface PIIEncounterDetails {
  id: number;
  csruid: string;
  consentDate: string;
  startTime?: string;
  site?: string;
  responses: ResponseInfo[];
  addresses: AddressDetails[];
  events: EventInfo[];
  samples: SampleInfo[];
  birthDate?: string; // FHIR:date
  gender: PatientInfoGender;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  followUpResponses?: FollowUpSurveyData;
}

export interface NonPIIEncounterDetails {
  id: number;
  encounterId: string;
  consentDate: string;
  startTime?: string;
  site?: string;
  responses: ResponseInfo[];
  locations: Location[];
  events: EventInfo[];
  samples: SampleInfo[];
  participant: string;
  birthYear?: number;
  followUpResponses?: FollowUpSurveyData;
}
