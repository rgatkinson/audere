import { Action, SurveyResponse } from "../store";

export interface SurveyQuestionData {
  buttons: ButtonConfig[];
  id: string;
  description?: string;
  optionList?: OptionListConfig;
  title?: string;
  required?: boolean;
}

export interface ButtonConfig {
  key: string;
  primary: boolean;
  enabled: boolean;
  subtextKey?: string;
}

export interface OptionListConfig {
  options: string[];
  multiSelect: boolean;
  numColumns?: number;
  withOther: boolean;
  defaultOptions?: string[];
  otherPlaceholder?: string;
  exclusiveOption?: string;
  inclusiveOption?: string;
}

export const AgeBuckets: {
  [key: string]: string;
} = {
  Senior: "65andOlder",
  MiddleAge: "45to64",
  Adult: "35to44",
  YoungAdult: "25to34",
  VeryYoungAdult: "18to24",
  Under18: "under18",
};

export const AddressConfig: SurveyQuestionData = {
  id: "Address",
  title: "address",
  description: "addressDesc",
  buttons: [{ key: "next", primary: true, enabled: true }],
};

export const AgeConfig: SurveyQuestionData = {
  id: "Age",
  title: "ageTitle",
  buttons: [
    { key: AgeBuckets.Under18, primary: false, enabled: true },
    { key: AgeBuckets.VeryYoungAdult, primary: false, enabled: true },
    { key: AgeBuckets.YoungAdult, primary: false, enabled: true },
    { key: AgeBuckets.Adult, primary: false, enabled: true },
    { key: AgeBuckets.MiddleAge, primary: false, enabled: true },
    { key: AgeBuckets.Senior, primary: false, enabled: true },
  ],
};

export const ConsentConfig: SurveyQuestionData = {
  buttons: [],
  id: "Consent",
  title: "consentEmail",
};

export const SymptomsConfig: SurveyQuestionData = {
  id: "Symptoms",
  title: "symptomTitle",
  description: "selectAll",
  optionList: {
    multiSelect: true,
    options: [
      "feelingFeverish",
      "chillsOrSweats",
      "cough",
      "fatigue",
      "muscleOrBodyAches",
      "noneOfTheAbove",
    ],
    withOther: false,
    exclusiveOption: "noneOfTheAbove",
  },
  buttons: [{ key: "next", primary: true, enabled: true }],
};

export const WhatSymptomsConfig: SurveyQuestionData = {
  id: "WhatSymptoms",
  title: "whatSymptoms",
  description: "selectAll",
  optionList: {
    multiSelect: true,
    options: [
      "feelingFeverish",
      "chillsOrSweats",
      "cough",
      "soreThroat",
      "headache",
      "fatigue",
      "muscleOrBodyAches",
      "runningNose",
      "shortnessOfBreath",
    ],
    withOther: false,
  },
  buttons: [{ key: "next", primary: true, enabled: true }],
};

export const SymptomsStartConfig: SurveyQuestionData = {
  id: "SymptomsStart",
  title: "symptomsStart",
  description: "symptomsStart",
  buttons: [
    { key: "1day", primary: false, enabled: true },
    { key: "2days", primary: false, enabled: true },
    { key: "3days", primary: false, enabled: true },
    { key: "4days", primary: false, enabled: true },
  ],
};

export const InContactConfig: SurveyQuestionData = {
  id: "InContact",
  title: "inContact",
  buttons: [
    { key: "no", primary: false, enabled: true },
    { key: "yes", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true },
  ],
  required: true,
};

export const CoughSneezeConfig: SurveyQuestionData = {
  id: "CoughSneeze",
  title: "coughSneeze",
  buttons: [
    { key: "no", primary: false, enabled: true },
    { key: "yes", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true },
  ],
};
