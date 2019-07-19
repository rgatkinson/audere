// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import crypto from "crypto";
import {
  DocumentType,
  EventInfoKind,
  CommonInfo,
  PIIInfo,
  SurveyDocument,
  SurveyInfo,
  SurveyNonPIIDbInfo,
  TelecomInfoSystem,
  ConsentInfoSignerType
} from "audere-lib/feverProtocol";

export const DEVICE = {
  installation: "uuid",
  clientVersion: {
    buildDate: "buildDate",
    hash: "hash",
    name: "name",
    version: "version"
  },
  yearClass: "2020",
  idiomText: "handset",
  platform: {
    ios: {}
  }
};

export const FAKE_EMAIL = "fakename@email.org";

export const PATIENT_INFO = {
  firstName: "Fake",
  lastName: "Name",
  birthDate: "1900-01-01",
  telecom: [
    {
      system: TelecomInfoSystem.Email,
      value: FAKE_EMAIL
    }
  ],
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

const CONSENT_NONPII_INFO = {
  terms: "I agree.",
  signerType: ConsentInfoSignerType.Subject,
  date: "2019-01-01"
};

const CONSENT_INFO = {
  ...CONSENT_NONPII_INFO,
  firstName: "Fake",
  lastName: "Name",
  signature: "AAAAAAAAAA"
};

const COMMON_INFO: CommonInfo = {
  isDemo: false,
  workflow: {
    screeningCompletedAt: "2019-01-01T00:00:00Z",
    surveyStartedAt: "2019-01-01T00:00:00Z"
  },
  events: [
    {
      kind: EventInfoKind.Sample,
      at: "2019-01-01T00:00:00Z",
      until: "2019-01-01T01:00:00Z"
    }
  ]
};
export const PII: PIIInfo = {
  ...COMMON_INFO,
  patient: PATIENT_INFO,
  consents: [CONSENT_INFO],
  responses: [
    {
      id: "Questionnaire",
      item: [PII_RESPONSE_ITEM]
    }
  ]
};

export const SURVEY_NONPII: SurveyNonPIIDbInfo = {
  ...COMMON_INFO,
  samples: [SAMPLE_INFO],
  consents: [CONSENT_NONPII_INFO],
  responses: [
    {
      id: "Questionnaire",
      item: [NONPII_RESPONSE_ITEM]
    }
  ]
};
export const SURVEY_INFO: SurveyInfo = {
  ...SURVEY_NONPII,
  ...PII,
  consents: [CONSENT_INFO],
  responses: [
    {
      id: "Questionnaire",
      item: [PII_RESPONSE_ITEM, NONPII_RESPONSE_ITEM]
    }
  ]
};

export function surveyPost(csruid: string): SurveyDocument {
  return {
    schemaId: 1,
    csruid,
    documentType: DocumentType.Survey,
    device: DEVICE,
    survey: SURVEY_INFO
  };
}

export function surveyNonPIIInDb(csruid: string) {
  return { csruid, device: DEVICE, survey: SURVEY_NONPII };
}

export function surveyPIIInDb(csruid: string) {
  return { csruid, device: DEVICE, survey: PII };
}

export function makeCSRUID(seed: string): string {
  // SHA256 as hex string happens to be 64 characters long
  const hash = crypto.createHash("sha256");
  hash.update(seed);
  return hash.digest("hex").toString();
}
