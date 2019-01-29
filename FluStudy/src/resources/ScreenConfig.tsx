import { SurveyQuestionData } from "./QuestionnaireConfig";

export const AgeBuckets: {
  [key: string]: string;
} = {
  Senior: "65andOlder",
  MiddleAge: "49to64",
  YoungAdult: "18to49",
  Under18: "under18",
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

export const BloodConfig: SurveyQuestionData = {
  id: "BloodScreen",
  title: "bloodTitle",
  description: {
    label: "bloodDescription",
  },
  buttons: [
    {
      enabled: true,
      key: "yes",
      primary: true,
      subtextKey: "yesBloodButtonSubtext",
    },
    {
      enabled: true,
      key: "no",
      primary: true,
      subtextKey: "noBloodButtonSubtext",
    },
  ],
};

export const BloodConsentConfig: SurveyQuestionData = {
  buttons: [],
  id: "BloodConsent",
  title: "bloodConsent",
  description: {
    label: "bloodThankYouAssisting",
  },
};

export const ConsentConfig: SurveyQuestionData = {
  buttons: [],
  id: "Consent",
  title: "consent",
  description: {
    label: "thankYouAssisting",
  },
};

export const HipaaConfig: SurveyQuestionData = {
  buttons: [],
  id: "HipaaConsent",
  title: "hipaaConsent",
  description: {
    label: "hipaaThankYouAssisting",
  },
};


export const EnrolledConfig: SurveyQuestionData = {
  id: "Enrolled",
  title: "enrolledTitle",
  description: {
    label: "enrolledDescription",
  },
  optionList: {
    multiSelect: true,
    options: [
      "sendCopyOfMyConsent",
      "askAboutMyIllness",
      "learnAboutStudy",
      "allOfTheAbove",
      "doNotEmailMe",
    ],
    withOther: false,
    defaultOptions: ["sendCopyOfMyConsent"],
    inclusiveOption: "allOfTheAbove",
    exclusiveOption: "doNotEmailMe",
  },
  buttons: [
    { key: "done", primary: true, enabled: true },
  ],
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
