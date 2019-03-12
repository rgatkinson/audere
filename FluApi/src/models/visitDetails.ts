// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Age, Location } from "audere-lib/hutchProtocol";
import { PatientInfo, VisitNonPIIInfo } from "audere-lib/snifflesProtocol";

export interface PIIVisitDetails {
  id: number;
  csruid: string;
  consentDate: string;
  visitInfo: VisitNonPIIInfo;
  patientInfo: PatientInfo;
}

export interface NonPIIVisitDetails {
  id: number;
  visitId: string;
  visitInfo: VisitNonPIIInfo;
  consentDate: string;
  participant: string;
  locations: Location[];
  birthYear?: number;
}
