// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { PatientInfo, VisitNonPIIInfo } from "audere-lib/snifflesProtocol";
import { Location } from "./encounter";

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
  household?: Location;
  workplace?: Location;
}
