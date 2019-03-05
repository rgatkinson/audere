import { Action, SurveyResponse } from "../store";

export interface SurveyQuestionData {
  buttons: ButtonConfig[];
  id: string;
  dateInput?: boolean;
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
  exclusiveOptions?: string[];
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
    exclusiveOptions: ["noneOfTheAbove"],
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
  required: true,
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
  required: true,
};

export const Last48Config: SurveyQuestionData = {
  id: "SymptomsLast48",
  title: "symptomsLast48",
  buttons: [
    { key: "no", primary: false, enabled: true },
    { key: "yes", primary: false, enabled: true },
  ],
  required: true,
};

export const SymptomSeverityConfig: SurveyQuestionData = {
  id: "SymptomsSeverity",
  title: "symptomsSeverity",
  description: "symptomsSeverity",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true },
  ],
  required: true,
};

export const InContactConfig: SurveyQuestionData = {
  id: "InContact",
  title: "inContact",
  buttons: [
    { key: "no", primary: false, enabled: true },
    { key: "yes", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true },
  ],
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

export const YoungChildrenConfig: SurveyQuestionData = {
  id: "YoungChildren",
  title: "youngChildren",
  optionList: {
    options: [
      "noContactUnderFive",
      "oneChild",
      "twoToFiveChildren",
      "moreThanFiveChildren",
      "doNotKnow",
    ],
    withOther: false,
    multiSelect: false,
  },
  buttons: [],
};

export const HouseholdChildrenConfig: SurveyQuestionData = {
  id: "HouseholdChildren",
  title: "householdChildren",
  buttons: [
    { key: "no", primary: false, enabled: true },
    { key: "yes", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true },
  ],
};

export const ChildrenWithChildrenConfig: SurveyQuestionData = {
  id: "ChildrenWithChildren",
  title: "childrenWithChildren",
  buttons: [
    { key: "no", primary: false, enabled: true },
    { key: "yes", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true },
  ],
};

export const PeopleInHouseholdConfig: SurveyQuestionData = {
  id: "PeopleInHousehold",
  title: "peopleInHousehold",
  buttons: [
    { key: "1to2", primary: false, enabled: true },
    { key: "3to4", primary: false, enabled: true },
    { key: "5to7", primary: false, enabled: true },
    { key: "8plus", primary: false, enabled: true },
  ],
};

export const BedroomsConfig: SurveyQuestionData = {
  id: "Bedrooms",
  title: "bedrooms",
  buttons: [
    { key: "0-1", primary: false, enabled: true },
    { key: "2", primary: false, enabled: true },
    { key: "3", primary: false, enabled: true },
    { key: "4", primary: false, enabled: true },
    { key: "5+", primary: false, enabled: true },
  ],
};

export const MedConditionsConfig: SurveyQuestionData = {
  id: "MedicalCondition",
  title: "medicalCondition",
  description: "selectAll",
  optionList: {
    multiSelect: true,
    options: ["asthma", "copd", "diabetes", "noneOfThese", "doNotKnow"],
    withOther: false,
    exclusiveOptions: ["noneOfThese", "doNotKnow"],
  },

  buttons: [],
};

export const FluShotConfig: SurveyQuestionData = {
  id: "FluShot",
  title: "fluShot",
  buttons: [
    { key: "no", primary: false, enabled: true },
    { key: "yes", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true },
  ],
};

export const FluShotDateConfig: SurveyQuestionData = {
  id: "FluShotDate",
  title: "fluShotDate",
  buttons: [],
  dateInput: true,
};

export const TobaccoConfig: SurveyQuestionData = {
  id: "SmokeTobacco",
  title: "smokeTobacco",
  buttons: [
    { key: "no", primary: false, enabled: true },
    { key: "yes", primary: false, enabled: true },
  ],
};

export const HouseholdTobaccoConfig: SurveyQuestionData = {
  id: "HouseholdTobacco",
  title: "householdTobacco",
  buttons: [
    { key: "no", primary: false, enabled: true },
    { key: "yes", primary: false, enabled: true },
  ],
};

export const InterferingConfig: SurveyQuestionData = {
  id: "Interfering",
  title: "interfering",
  buttons: [
    { key: "no", primary: false, enabled: true },
    { key: "yes", primary: false, enabled: true },
  ],
};

export const AntibioticsConfig: SurveyQuestionData = {
  id: "Antibiotics",
  title: "antibiotics",
  buttons: [
    { key: "no", primary: false, enabled: true },
    { key: "yes", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true },
  ],
  required: true,
};

export const AssignedSexConfig: SurveyQuestionData = {
  id: "AssignedSex",
  title: "assignedSex",
  buttons: [
    { key: "male", primary: false, enabled: true },
    { key: "female", primary: false, enabled: true },
    { key: "other", primary: false, enabled: true },
  ],
};

export const RaceConfig: SurveyQuestionData = {
  id: "Race",
  title: "race",
  buttons: [],
  description: "selectAll",
  optionList: {
    options: [
      "americanIndianOrAlaskaNative",
      "asian",
      "nativeHawaiian",
      "blackOrAfricanAmerican",
      "white",
      "other",
    ],
    multiSelect: true,
    withOther: false,
  },
};

export const HispanicConfig: SurveyQuestionData = {
  id: "Hispanic",
  title: "hispanic",
  buttons: [
    { key: "no", primary: false, enabled: true },
    { key: "yes", primary: false, enabled: true },
  ],
};

export const InsuranceConfig: SurveyQuestionData = {
  id: "HealthInsurance",
  title: "healthInsurance",
  description: "selectAll",
  buttons: [],
  optionList: {
    options: [
      "noInsurance",
      "privateInsuranceEmployer",
      "privateInsuranceSelf",
      "governmentInsurance",
      "other",
      "doNotKnow",
    ],
    multiSelect: true,
    withOther: false,
    exclusiveOptions: ["noInsurance", "doNotKnow"],
  },
};

export const BlueLineConfig: SurveyQuestionData = {
  id: "BlueLine",
  title: "blueLine",
  description: "blueLine",
  buttons: [
    { key: "no", primary: false, enabled: true },
    { key: "yes", primary: false, enabled: true },
  ],
};

export const RedWhenBlueConfig: SurveyQuestionData = {
  id: "RedWhenBlue",
  title: "redLine",
  description: "selectOne",
  buttons: [
    { key: "noRed", primary: false, enabled: true },
    { key: "yesAboveBlue", primary: false, enabled: true },
    { key: "yesBelowBlue", primary: false, enabled: true },
    { key: "yesAboveBelowBlue", primary: false, enabled: true },
  ],
};

export const RedLineConfig: SurveyQuestionData = {
  id: "RedLine",
  title: "redLine",
  description: "selectOne",
  buttons: [
    { key: "noRed", primary: false, enabled: true },
    { key: "yesOneRed", primary: false, enabled: true },
    { key: "yesTwoRed", primary: false, enabled: true },
  ],
};

export const FirstTestFeedbackConfig: SurveyQuestionData = {
  id: "FirstTestFeedback",
  title: "firstTestFeedback",
  description: "selectMostApplicable",
  buttons: [
    { key: "easyCorrect", primary: false, enabled: true },
    { key: "confusingCorrect", primary: false, enabled: true },
    { key: "confusingNotCorrect", primary: false, enabled: true },
    { key: "incorrect", primary: false, enabled: true },
  ],
};

export const SecondTestFeedbackConfig: SurveyQuestionData = {
  id: "SecondTestFeedback",
  title: "secondTestFeedback",
  description: "selectMostApplicable",
  buttons: [
    { key: "easyCorrect", primary: false, enabled: true },
    { key: "confusingCorrect", primary: false, enabled: true },
    { key: "confusingNotCorrect", primary: false, enabled: true },
    { key: "incorrect", primary: false, enabled: true },
  ],
};

export const OptInForMessagesConfig: SurveyQuestionData = {
  id: "OptInForMessages",
  title: "optInForMessages",
  description: "optInForMessages",
  optionList: {
    multiSelect: true,
    options: [
      "contactMeNextSeason",
      "contactMeForFollowUpStudy",
      "sendMeStudy",
    ],
    withOther: false,
  },
  buttons: [],
};
