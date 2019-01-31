import { SurveyQuestionData } from "./QuestionnaireConfig";

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
  buttons: [
    { key: "next", primary: true, enabled: true },
  ],
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
};

export const ConsentConfig: SurveyQuestionData = {
  buttons: [],
  id: "Consent",
  title: "consent",
  description: {
    label: "thankYouAssisting",
  },
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
      "noneOfTheAbove"
    ],
    withOther: false,
    exclusiveOption: "noneOfTheAbove",
  },
  buttons: [
    { key: "next", primary: true, enabled: true },
  ],
};
