// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

const crypto = require('crypto');

import {
  DocumentType,
  VisitDocument,
  VisitInfo,
  VisitNonPIIDbInfo,
  VisitPIIInfo,
  VisitCommonInfo,
  EventInfoKind
} from "audere-lib";

const DEVICE = {
  installation: "uuid",
  clientVersion: "1.2.3-testing",
  deviceName: "My Phone",
  yearClass: "2020",
  idiomText: "handset",
  platform: "iOS"
};
export const PATIENT_INFO = {
  name: "Fake Name",
  birthDate: "1900-01-01",
  telecom: [],
  address: []
};
const SAMPLE_INFO = {
  sample_type: "SampleType",
  code: "Code"
};
const NONPII_RESPONSE_ITEM = {
  id: "CakeVeracity",
  text: "Is the cake a lie?",
  answer: [{ valueBoolean: true }]
};
const PII_RESPONSE_ITEM = {
  id: "BirthDate",
  text: "What is your birth date?",
  answer: [{ valueString: "1900-01-01" }]
};

const VISIT_COMMON_INFO: VisitCommonInfo = {
  isDemo: false,
  complete: true,
  location: "Location Name",
  administrator: "Administrator Name",
  events: [
    {
      kind: EventInfoKind.Visit,
      at: "2019-01-01T00:00:00Z",
      until: "2019-01-01T01:00:00Z"
    }
  ]
};
export const VISIT_NONPII: VisitNonPIIDbInfo = {
  ...VISIT_COMMON_INFO,
  samples: [SAMPLE_INFO],
  giftcards: [],
  consents: [],
  responses: [
    {
      id: "Questionnaire",
      item: [NONPII_RESPONSE_ITEM]
    }
  ]
};
export const VISIT_PII: VisitPIIInfo = {
  ...VISIT_COMMON_INFO,
  patient: PATIENT_INFO,
  consents: [],
  responses: [
    {
      id: "Questionnaire",
      item: [PII_RESPONSE_ITEM]
    }
  ]
};
export const VISIT_INFO: VisitInfo = {
  ...VISIT_NONPII,
  ...VISIT_PII,
  responses: [
    {
      id: "Questionnaire",
      item: [PII_RESPONSE_ITEM, NONPII_RESPONSE_ITEM]
    }
  ]
};

export function documentContentsPost(csruid: string): VisitDocument {
  return {
    schemaId: 1,
    csruid,
    documentType: DocumentType.Visit,
    device: DEVICE,
    visit: VISIT_INFO
  }
}

export function documentContentsNonPII(csruid: string) {
  return { csruid, device: DEVICE, visit: VISIT_NONPII };
}

export function documentContentsPII(csruid: string) {
  return { csruid, device: DEVICE, visit: VISIT_PII };
}

export function makeCSRUID(seed: string): string {
  const hash = crypto.createHash("sha512");
  hash.update(seed);
  return hash.digest("utf8").substring(0, 64);
}
