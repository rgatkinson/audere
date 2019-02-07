import { Action, setScreeningResponses, SurveyResponse } from "../store";

export interface SurveyQuestionData {
  buttons: ButtonConfig[];
  id: string;
  description?: DescriptionConfig;
  optionList?: OptionListConfig;
  responseType: "screening" | "survey";
  title?: string;
  updateFunction(responses: SurveyResponse[]): Action;
}

export interface ButtonConfig {
  key: string;
  primary: boolean;
  enabled: boolean;
  subtextKey?: string;
}

interface DescriptionConfig {
  label: string;
  center?: boolean;
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
  MiddleAge: "49to64",
  YoungAdult: "18to49",
  Under18: "under18",
};

export const AddressConfig: SurveyQuestionData = {
  id: "Address",
  title: "address",
  description: {
    label: "addressDesc",
  },
  buttons: [{ key: "next", primary: true, enabled: true }],
  responseType: "screening",
  updateFunction: setScreeningResponses,
};

export const AgeConfig: SurveyQuestionData = {
  id: "Age",
  title: "ageTitle",
  buttons: [
    { key: AgeBuckets.Senior, primary: false, enabled: true },
    { key: AgeBuckets.MiddleAge, primary: false, enabled: true },
    { key: AgeBuckets.YoungAdult, primary: false, enabled: true },
    { key: AgeBuckets.Under18, primary: false, enabled: true },
  ],
  responseType: "screening",
  updateFunction: setScreeningResponses,
};

export const ConsentConfig: SurveyQuestionData = {
  buttons: [],
  id: "Consent",
  title: "consentEmail",
  responseType: "screening",
  updateFunction: setScreeningResponses,
};

export const SymptomsConfig: SurveyQuestionData = {
  id: "Symptoms",
  title: "symptomTitle",
  description: {
    label: "selectAll",
  },
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
  responseType: "screening",
  updateFunction: setScreeningResponses,
};
