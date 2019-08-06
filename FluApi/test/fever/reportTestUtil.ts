// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { surveyPIIInDb } from "../endpoints/feverSampleData";
import {
  TelecomInfoSystem,
  AddressInfoUse,
  PIIInfo,
} from "audere-lib/feverProtocol";
import { SurveyAttributes } from "../../src/models/db/fever";
import { Batch, BatchItem } from "../../src/services/fever/surveyBatchData";
import { GeocodingResponse } from "../../src/models/geocoding";
import { KitRecipient } from "../../src/services/fever/kitOrders";
import { SurveyCompleteParticipant } from "../../src/services/fever/surveyCompleteReport";

export function makeBatchData(
  num: number
): [Batch<BatchItem>, SurveyAttributes<PIIInfo>[]] {
  const items = [];
  const surveys = [];

  for (let i = 0; i < num; i++) {
    items.push({
      workflowId: i,
      surveyId: i,
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
    value: "email" + id + "@email.com",
  });

  data.survey.patient.address.push({
    use: AddressInfoUse.Home,
    firstName: "first",
    lastName: "last",
    line: [id + " Main St."],
    city: "Schenectady",
    state: "NY",
    postalCode: "12345",
    country: "US",
  });

  return data;
}

export function makeRandomGeoResponse(item: BatchItem): GeocodingResponse {
  return {
    id: item.workflowId.toString(),
    use: AddressInfoUse.Home,
    addresses: [
      {
        canonicalAddress: makeRandomString(),
        address1: makeRandomString(),
        address2: makeRandomString(),
        city: makeRandomString(),
        state: makeRandomString(),
        postalCode: makeRandomString(),
        latitude: 1,
        longitude: 1,
        censusTract: makeRandomString(),
      },
    ],
  };
}

export function makeRandomKitReceipient(num: number): KitRecipient {
  return {
    workflowId: num,
    surveyId: Math.floor(Math.random() * 10) + 1,
    firstName: makeRandomString(),
    lastName: makeRandomString(),
    homeAddress: undefined,
    email: makeRandomString(),
    timestamp: makeRandomString(),
  };
}

export function makeRandomIncentiveRecipient(
  num: number
): SurveyCompleteParticipant {
  return {
    workflowId: num,
    surveyId: Math.floor(Math.random() * 10) + 1,
    firstName: makeRandomString(),
    lastName: makeRandomString(),
    homeAddress: {
      use: AddressInfoUse.Home,
      city: makeRandomString(),
      state: makeRandomString(),
      postalCode: makeRandomString(),
      country: makeRandomString(),
      line: [makeRandomString()],
    },
    email: makeRandomString(),
    timestamp: makeRandomString(),
    dateReceived: makeRandomString(),
    boxBarcode: makeRandomString(),
    incentiveAmount: "50.00",
  };
}

function makeRandomString(): string {
  return Math.random()
    .toString(36)
    .substring(6);
}
