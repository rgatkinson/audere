import { SurveyQuestionData } from "./QuestionnaireConfig";

export const AgeBucketConfig: SurveyQuestionData = {
  id: "AgeBucket",
  title: "ageTitle",
  buttons: [
    { key: "18orOver", primary: false, enabled: true },
    { key: "13to17", primary: false, enabled: true },
    { key: "7to12", primary: false, enabled: true },
    { key: "under7", primary: false, enabled: true },
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

export const EnrolledConfig: SurveyQuestionData = {
  id: "Enrolled",
  title: "enrolledTitle",
  description: {
    label: "enrolledDescription",
  },
  optionList: {
    multiSelect: true,
    options: ["sendCopyOfMyConsent", "askAboutMyIllness", "learnAboutStudy", "allOfTheAbove"],
    withOther: false,
  },
  buttons: [
    { key: "done", primary: true, enabled: true },
    { key: "doNotEmailMe", primary: false, enabled: true },
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
