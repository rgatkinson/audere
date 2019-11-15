// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  FOREIGN_COUNTRY_MULTIDROPDOWN_DATA,
  STATE_DROPDOWN_DATA,
} from "./chillsQuestionData";

export interface ButtonConfig {
  enabled: boolean;
  expandableHelpImage?: boolean;
  helpImageUri?: string;
  key: string;
  primary: boolean;
}

export interface ConditionalQuestionConfig {
  answer: string;
  id: string;
  key: string;
  anythingBut?: boolean;
}

export enum SurveyQuestionType {
  ButtonGrid = "buttonGrid",
  DatePicker = "datePicker",
  Dropdown = "dropdown",
  MonthPicker = "monthPicker",
  MultiDropdown = "multiDropdown",
  OptionQuestion = "optionQuestion",
  RadioGrid = "radioGrid",
  Text = "text",
  TextInput = "textInput",
  ZipCodeInput = "zipCodeInput",
}

export interface SurveyQuestion {
  buttons: ButtonConfig[];
  conditions?: ConditionalQuestionConfig[] | ConditionalQuestionConfig[][];
  description?: string;
  id: string;
  required?: boolean;
  subquestion?: boolean;
  title?: string;
  type: SurveyQuestionType;
}

export interface OptionQuestion extends SurveyQuestion {
  inclusiveOption?: string;
  exclusiveOptions?: string[];
  options: string[];
}

export interface TextQuestion extends SurveyQuestion {
  placeholder: string;
}

export interface DropDownQuestion extends SurveyQuestion {
  placeholder: string;
}

export interface MonthQuestion extends SurveyQuestion {
  monthRange: number;
}

export interface DateQuestion extends SurveyQuestion {
  minDate?: Date;
}

export interface MultiDropDownQuestion extends SurveyQuestion {
  placeholder: string;
  options: string[];
}

// ================================================================
//
// NOTE: Please make sure, as you add questions, that all questions
// are included in the SURVEY_QUESTIONS array at the bottom of this
// file.
//
// ================================================================

export const WhatSymptomsConfig: OptionQuestion = {
  buttons: [{ key: "next", primary: true, enabled: true }],
  description: "selectAll",
  id: "WhatSymptoms",
  options: [
    "feelingFeverish",
    "headache",
    "cough",
    "chillsOrShivering",
    "sweats",
    "soreThroat",
    "vomiting",
    "runningNose",
    "sneezing",
    "fatigue",
    "muscleOrBodyAches",
    "troubleBreathing",
    "noneOfTheAbove",
  ],
  required: true,
  exclusiveOptions: ["noneOfTheAbove"],
  title: "whatSymptoms",
  type: SurveyQuestionType.OptionQuestion,
};

export const SymptomsSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity",
  buttons: [],
  conditions: [
    {
      key: "selectedButtonKey",
      id: WhatSymptomsConfig.id,
      answer: "noneOfTheAbove",
      anythingBut: true,
    },
  ],
  title: "symptomsSeverity",
  description: "symptomsSeverity",
  required: true,
  type: SurveyQuestionType.Text,
};

export const FeverSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_feelingFeverish",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true },
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "feelingFeverish",
    },
  ],
  description: "feelingFeverish",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid,
};

export const HeadacheSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_headache",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true },
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "headache",
    },
  ],
  description: "headache",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid,
};

export const CoughSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_cough",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true },
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "cough",
    },
  ],
  description: "cough",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid,
};

export const ChillsSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_chillsOrShivering",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true },
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "chillsOrShivering",
    },
  ],
  description: "chillsOrShivering",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid,
};

export const SweatsSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_sweats",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true },
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "sweats",
    },
  ],
  description: "sweats",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid,
};

export const SoreThroatSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_soreThroat",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true },
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "soreThroat",
    },
  ],
  description: "soreThroat",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid,
};

export const VomitingSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_vomiting",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true },
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "vomiting",
    },
  ],
  description: "vomiting",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid,
};

export const RunningNoseSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_runningNose",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true },
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "runningNose",
    },
  ],
  description: "runningNose",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid,
};

export const SneezingSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_sneezing",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true },
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "sneezing",
    },
  ],
  description: "sneezing",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid,
};

export const FatigueSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_fatigue",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true },
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "fatigue",
    },
  ],
  description: "fatigue",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid,
};

export const AchesSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_muscleOrBodyAches",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true },
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "muscleOrBodyAches",
    },
  ],
  description: "muscleOrBodyAches",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid,
};

export const TroubleBreathingSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_troubleBreathing",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true },
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "troubleBreathing",
    },
  ],
  description: "troubleBreathing",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid,
};

export const WhenFirstNoticedIllnessConfig: SurveyQuestion = {
  buttons: [],
  id: "WhenFirstNoticedIllness",
  required: true,
  title: "whenFirstNoticedIllness",
  type: SurveyQuestionType.DatePicker,
};

export const HowLongToSickestConfig: SurveyQuestion = {
  buttons: [
    { key: "halfDay", primary: false, enabled: true },
    { key: "half-1Day", primary: false, enabled: true },
    { key: "1-1HalfDays", primary: false, enabled: true },
    { key: "1Half-2Days", primary: false, enabled: true },
    { key: "3Days", primary: false, enabled: true },
    { key: "4Days", primary: false, enabled: true },
    { key: "5+Days", primary: false, enabled: true },
  ],
  id: "HowLongToSickest",
  required: true,
  title: "howLongToSickest",
  type: SurveyQuestionType.RadioGrid,
};

export const FluOrColdConfig: SurveyQuestion = {
  buttons: [
    { key: "flu", primary: false, enabled: true },
    { key: "commonCold", primary: false, enabled: true },
    { key: "anotherIllness", primary: false, enabled: true },
  ],
  id: "FluOrCold",
  title: "fluOrCold",
  type: SurveyQuestionType.RadioGrid,
};

export const WorseOrDifferentFromTypicalConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
  ],
  id: "WorseOrDifferentFromTypical",
  title: "worseOrDifferentFromTypical",
  type: SurveyQuestionType.RadioGrid,
};

export const AntiviralConfig: SurveyQuestion = {
  buttons: [
    { key: "no", primary: false, enabled: true },
    { key: "oseltamivir", primary: false, enabled: true },
    { key: "zanamivir", primary: false, enabled: true },
    { key: "peramivir", primary: false, enabled: true },
    { key: "baloxavir", primary: false, enabled: true },
    { key: "yesButDontKnowWhich", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true },
  ],
  id: "MedicationAntiviral",
  required: true,
  title: "antiviral",
  type: SurveyQuestionType.RadioGrid,
};

export const WhenFirstStartedAntiviralConfig: SurveyQuestion = {
  buttons: [],
  conditions: [
    {
      key: "selectedButtonKey",
      id: AntiviralConfig.id,
      answer: "no",
      anythingBut: true,
    },
    {
      key: "selectedButtonKey",
      id: AntiviralConfig.id,
      answer: "dontKnow",
      anythingBut: true,
    },
  ],
  id: "WhenFirstStartedAntiviral",
  required: true,
  title: "whenFirstStartedAntiviral",
  type: SurveyQuestionType.DatePicker,
};

export const FluShotConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true },
  ],
  id: "FluShot",
  required: true,
  title: "fluShot",
  type: SurveyQuestionType.RadioGrid,
};

export const FluShotDateConfig: DateQuestion = {
  buttons: [],
  conditions: [
    { key: "selectedButtonKey", id: FluShotConfig.id, answer: "yes" },
  ],
  id: "FluShotDate",
  minDate: new Date(2019, 6, 1),
  required: true,
  title: "fluShotDate",
  type: SurveyQuestionType.DatePicker,
};

export const HowReceivedFluShotConfig: SurveyQuestion = {
  buttons: [
    { key: "injection", primary: false, enabled: true },
    { key: "nasalSpray", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true },
  ],
  conditions: [
    { key: "selectedButtonKey", id: FluShotConfig.id, answer: "yes" },
  ],
  id: "HowReceivedFluShot",
  required: true,
  title: "howReceivedFluShot",
  type: SurveyQuestionType.RadioGrid,
};

export const AffectedRegularActivitiesConfig: SurveyQuestion = {
  buttons: [
    { key: "notAtAll", primary: false, enabled: true },
    { key: "aLittleBit", primary: false, enabled: true },
    { key: "somewhat", primary: false, enabled: true },
    { key: "quiteABit", primary: false, enabled: true },
    { key: "veryMuch", primary: false, enabled: true },
  ],
  id: "AffectedRegularActivities",
  title: "affectedRegularActivities",
  type: SurveyQuestionType.RadioGrid,
};

export const SmokeTobaccoConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
  ],
  id: "SmokeTobacco",
  title: "smokeTobacco",
  type: SurveyQuestionType.RadioGrid,
};

export const HouseholdTobaccoConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
  ],
  id: "HouseholdTobacco",
  title: "householdTobacco",
  type: SurveyQuestionType.RadioGrid,
};

export const TravelOutsideStateConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
  ],
  id: "TravelOutsideState",
  required: true,
  title: "travelOutsideState",
  type: SurveyQuestionType.RadioGrid,
};

export const TravelOutsideUSConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
  ],
  conditions: [
    {
      key: "selectedButtonKey",
      id: TravelOutsideStateConfig.id,
      answer: "yes",
    },
  ],
  id: "TravelOutsideUS",
  required: true,
  title: "travelOutsideUS",
  type: SurveyQuestionType.RadioGrid,
};

export const SpentTimeCityConfig: TextQuestion = {
  buttons: [],
  conditions: [
    [
      {
        key: "selectedButtonKey",
        id: TravelOutsideStateConfig.id,
        answer: "no",
      },
    ],
    [
      {
        key: "selectedButtonKey",
        id: TravelOutsideStateConfig.id,
        answer: "yes",
      },
      {
        key: "selectedButtonKey",
        id: TravelOutsideUSConfig.id,
        answer: "no",
      },
    ],
  ],
  id: "SpentTimeCity",
  placeholder: "enterCity",
  required: true,
  title: "spentTimeCity",
  type: SurveyQuestionType.TextInput,
};

export const SpentTimeStateConfig: DropDownQuestion = {
  buttons: STATE_DROPDOWN_DATA,
  conditions: [
    [
      {
        key: "selectedButtonKey",
        id: TravelOutsideStateConfig.id,
        answer: "no",
      },
    ],
    [
      {
        key: "selectedButtonKey",
        id: TravelOutsideStateConfig.id,
        answer: "yes",
      },
      {
        key: "selectedButtonKey",
        id: TravelOutsideUSConfig.id,
        answer: "no",
      },
    ],
  ],
  id: "SpentTimeState",
  placeholder: "selectState",
  required: true,
  type: SurveyQuestionType.Dropdown,
};

export const SpentTimeZipCodeConfig: TextQuestion = {
  buttons: [],
  conditions: [
    [
      {
        key: "selectedButtonKey",
        id: TravelOutsideStateConfig.id,
        answer: "no",
      },
    ],
    [
      {
        key: "selectedButtonKey",
        id: TravelOutsideStateConfig.id,
        answer: "yes",
      },
      {
        key: "selectedButtonKey",
        id: TravelOutsideUSConfig.id,
        answer: "no",
      },
    ],
  ],
  id: "SpentTimeZipCode",
  placeholder: "enterZip",
  required: true,
  type: SurveyQuestionType.ZipCodeInput,
};

export const WhichCountriesOutsideUSConfig: MultiDropDownQuestion = {
  buttons: [],
  conditions: [
    {
      key: "selectedButtonKey",
      id: TravelOutsideStateConfig.id,
      answer: "yes",
    },
    {
      key: "selectedButtonKey",
      id: TravelOutsideUSConfig.id,
      answer: "yes",
    },
  ],
  id: "WhichCountriesOutsideUS",
  options: FOREIGN_COUNTRY_MULTIDROPDOWN_DATA,
  placeholder: "selectCountries",
  title: "whichCountriesOutsideUS",
  type: SurveyQuestionType.MultiDropdown,
};

export const PeopleInHouseholdConfig: SurveyQuestion = {
  buttons: [
    { key: "liveByMyself", primary: false, enabled: true },
    { key: "two", primary: false, enabled: true },
    { key: "three", primary: false, enabled: true },
    { key: "four", primary: false, enabled: true },
    { key: "five", primary: false, enabled: true },
    { key: "sixOrMore", primary: false, enabled: true },
  ],
  id: "PeopleInHousehold",
  title: "peopleInHousehold",
  type: SurveyQuestionType.RadioGrid,
};

export const ChildrenAgeGroupsConfig: OptionQuestion = {
  buttons: [{ key: "next", primary: true, enabled: true }],
  conditions: [
    {
      key: "selectedButtonKey",
      id: PeopleInHouseholdConfig.id,
      answer: "liveByMyself",
      anythingBut: true,
    },
  ],
  description: "selectAll",
  id: "ChildrenAgeGroups",
  options: ["noChildren", "zeroToFive", "sixToTwelve", "olderThanTwelve"],
  exclusiveOptions: ["noChildren"],
  title: "childrenAgeGroups",
  type: SurveyQuestionType.OptionQuestion,
};

export const ChildrenDaycarePreschoolConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
  ],
  conditions: [
    {
      key: "selectedButtonKey",
      id: PeopleInHouseholdConfig.id,
      answer: "liveByMyself",
      anythingBut: true,
    },
    {
      key: "options",
      id: ChildrenAgeGroupsConfig.id,
      answer: "zeroToFive",
    },
  ],
  id: "ChildrenDaycarePreschool",
  title: "childrenDaycarePreschool",
  type: SurveyQuestionType.RadioGrid,
};

export const SomeoneDiagnosedConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true },
  ],
  conditions: [
    {
      key: "selectedButtonKey",
      id: PeopleInHouseholdConfig.id,
      answer: "liveByMyself",
      anythingBut: true,
    },
  ],
  id: "SomeoneDiagnosed",
  title: "someoneDiagnosed",
  type: SurveyQuestionType.RadioGrid,
};

export const InContactConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true },
  ],
  id: "InContact",
  title: "inContact",
  type: SurveyQuestionType.RadioGrid,
};

export const PublicTransportationConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
  ],
  id: "PublicTransportation",
  title: "publicTransportation",
  type: SurveyQuestionType.RadioGrid,
};

export const AroundSickChildrenConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
  ],
  id: "AroundSickChildren",
  title: "aroundSickChildren",
  type: SurveyQuestionType.RadioGrid,
};

export const FutureStudiesConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
  ],
  id: "FutureStudies",
  title: "futureStudies",
  required: true,
  type: SurveyQuestionType.RadioGrid,
};

export const BlueLineConfig: SurveyQuestion = {
  id: "BlueLine",
  title: "blueLine",
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
  ],
  required: true,
  type: SurveyQuestionType.ButtonGrid,
};

export const PinkWhenBlueConfig: SurveyQuestion = {
  id: "PinkWhenBlue",
  conditions: [
    {
      key: "selectedButtonKey",
      id: BlueLineConfig.id,
      answer: "yes",
    },
  ],
  title: "pinkLine",
  buttons: [
    {
      key: "noPink",
      primary: false,
      enabled: true,
      helpImageUri: "blueonly",
    },
    {
      key: "yesAboveBlue",
      primary: false,
      enabled: true,
      helpImageUri: "pinklineaboveblueline",
    },
    {
      key: "yesBelowBlue",
      primary: false,
      enabled: true,
      helpImageUri: "pinklinebelowblueline",
    },
    {
      key: "yesAboveBelowBlue",
      primary: false,
      enabled: true,
      helpImageUri: "pinklineabovebelow",
    },
  ],
  required: true,
  type: SurveyQuestionType.RadioGrid,
};

export const SURVEY_QUESTIONS = [
  WhatSymptomsConfig,
  SymptomsSeverityConfig,
  FeverSeverityConfig,
  HeadacheSeverityConfig,
  CoughSeverityConfig,
  ChillsSeverityConfig,
  SweatsSeverityConfig,
  SoreThroatSeverityConfig,
  VomitingSeverityConfig,
  RunningNoseSeverityConfig,
  SneezingSeverityConfig,
  FatigueSeverityConfig,
  AchesSeverityConfig,
  TroubleBreathingSeverityConfig,
  WhenFirstNoticedIllnessConfig,
  HowLongToSickestConfig,
  FluOrColdConfig,
  WorseOrDifferentFromTypicalConfig,
  AntiviralConfig,
  WhenFirstStartedAntiviralConfig,
  FluShotConfig,
  FluShotDateConfig,
  HowReceivedFluShotConfig,
  AffectedRegularActivitiesConfig,
  SmokeTobaccoConfig,
  HouseholdTobaccoConfig,
  TravelOutsideStateConfig,
  TravelOutsideUSConfig,
  SpentTimeCityConfig,
  SpentTimeStateConfig,
  SpentTimeZipCodeConfig,
  WhichCountriesOutsideUSConfig,
  PeopleInHouseholdConfig,
  ChildrenAgeGroupsConfig,
  ChildrenDaycarePreschoolConfig,
  SomeoneDiagnosedConfig,
  InContactConfig,
  PublicTransportationConfig,
  AroundSickChildrenConfig,
  FutureStudiesConfig,
  BlueLineConfig,
  PinkWhenBlueConfig,
];
