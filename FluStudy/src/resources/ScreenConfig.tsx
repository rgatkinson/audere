import { SurveyQuestionData } from "./QuestionnaireConfig";

export const AgeBuckets: {
  [key: string]: string;
} = {
  Over18: "18orOver",
  Teen: "13to17",
  Child: "7to12",
  Under7: "under7",
};

export const AgeBucketConfig: SurveyQuestionData = {
  id: "AgeBucket",
  title: "ageTitle",
  buttons: [
    { key: AgeBuckets.Over18, primary: false, enabled: true },
    { key: AgeBuckets.Teen, primary: false, enabled: true },
    { key: AgeBuckets.Child, primary: false, enabled: true },
    { key: AgeBuckets.Under7, primary: false, enabled: true },
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
      "headaches",
      "cough",
      "diarrhea",
      "soreThroat",
      "nauseaOrVomiting",
      "runnyOrStuffyNose",
      "rash",
      "fatigue",
      "muscleOrBodyAches",
      "increasedTroubleBreathing",
      "earPainOrDischarge",
    ],
    withOther: false,
  },
  buttons: [
    { key: "done", primary: true, enabled: true },
    { key: "noneOfTheAbove", primary: false, enabled: true },
  ],
};
