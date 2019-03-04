// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { surveyPIIInDb } from "../endpoints/feverSampleData";
import { TelecomInfoSystem, AddressInfoUse, PIIInfo } from "audere-lib/feverProtocol";
import { SurveyAttributes } from "../../src/models/fever";
import { Batch, BatchItem } from "../../src/services/feverApi/surveyBatchData";
import { Participant } from "../../src/services/feverApi/uwParticipantReport";
import { GeocodingResponse } from "../../src/models/geocoding";

export function makeBatchData(
  num: number
): [Batch<BatchItem>, SurveyAttributes<PIIInfo>[]] {
  const items = [];
  const surveys = [];

  for (let i = 0; i < num; i++) {
    items.push({
      workflowId: i,
      surveyId: i,
      csruid: "csruid" + i
    });
    surveys.push(makePiiData(i));
  }

  const batch = { id: Math.random(), items: items };
  return [batch, surveys];
}

function makePiiData(id: number): SurveyAttributes<PIIInfo> {
  const data = surveyPIIInDb("csruid" + id);

  data.survey.patient.telecom.push({ 
    system: TelecomInfoSystem.Email,
    value: "email" + id + "@email.com"
  });

  data.survey.patient.address.push({
    use: AddressInfoUse.Home,
    firstName: "first",
    lastName: "last",
    line: [id + " Main St."],
    city: "Schenectady",
    state: "NY",
    postalCode: "12345",
    country: "US"
  });

  return data;
}

export function makeRandomGeoResponse(
  participant: Participant
): GeocodingResponse {
  return {
    id: participant.workflowId,
    use: AddressInfoUse.Home,
    address: {
      canonicalAddress: makeRandomString(),
      address1: makeRandomString(),
      address2: makeRandomString(),
      city: makeRandomString(),
      state: makeRandomString(),
      postalCode: makeRandomString(),
      latitude: 1,
      longitude: 1,
      censusTract: makeRandomString()
    }
  }
}

export function makeRandomParticipant(num: number): Participant {
  return {
    workflowId: num,
    surveyId: Math.random(),
    firstName: makeRandomString(),
    lastName: makeRandomString(),
    homeAddress: undefined,
    email: makeRandomString(),
    timestamp: makeRandomString()
  }
}

function makeRandomString(): string {
  return Math.random().toString(36).substring(6);
}