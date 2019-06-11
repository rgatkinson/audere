// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { monthAsDate } from "../util/date";

export interface ButtonConfig {
  key: string;
  primary: boolean;
  enabled: boolean;
  helpImageUri?: string;
}

export interface conditionalQuestionConfig {
  key: string;
  id: string;
  answer: string;
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

export interface SurveyQuestionData {
  buttons: ButtonConfig[];
  id: string;
  type: string;
  condition?: conditionalQuestionConfig;
  dateInput?: boolean;
  description?: string;
  optionList?: OptionListConfig;
  placeholder?: string;
  startDate?: Date;
  subquestion?: boolean;
  title: string;
  ref?: any;
  required?: boolean;
}

export const AddressConfig: SurveyQuestionData = {
  id: "Address",
  title: "address",
  description: "addressDesc",
  buttons: [{ key: "next", primary: true, enabled: true }],
  type: "address",
};

export const WhatSymptomsConfig: SurveyQuestionData = {
  buttons: [{ key: "next", primary: true, enabled: true }],
  description: "selectAll",
  id: "WhatSymptoms",
  optionList: {
    multiSelect: true,
    options: [
      "feelingFeverish",
      "cough",
      "fatigue",
      "chillsOrSweats",
      "soreThroat",
      "headache",
      "muscleOrBodyAches",
      "runningNose",
      "shortnessOfBreath",
      "vomiting",
    ],
    withOther: false,
  },

  required: true,
  title: "whatSymptoms",
  type: "optionQuestion",
};

const SymptomsStartConfig: SurveyQuestionData = {
  id: "SymptomsStart",
  buttons: [],
  title: "symptomsStart",
  description: "symptomsStart",
  required: true,
  type: "text",
};

const SymptomsLast48Config: SurveyQuestionData = {
  id: "SymptomsLast48",
  buttons: [],
  title: "symptomsLast48",
  required: true,
  type: "text",
};

const SymptomsSeverityConfig: SurveyQuestionData = {
  id: "SymptomsSeverity",
  buttons: [],
  title: "symptomsSeverity",
  description: "symptomsSeverity",
  required: true,
  type: "text",
};

export const WhenSymptomsConfig: SurveyQuestionData[] = [SymptomsStartConfig]
  .concat(
    WhatSymptomsConfig.optionList!.options.map(option => {
      return {
        ...SymptomsStartConfig,
        id: SymptomsStartConfig.id + "_" + option,
        buttons: [
          { key: "1day", primary: false, enabled: true },
          { key: "2days", primary: false, enabled: true },
          { key: "3days", primary: false, enabled: true },
          { key: "4days", primary: false, enabled: true },
        ],
        description: option,
        condition: {
          key: "options",
          id: WhatSymptomsConfig.id,
          answer: option,
        },
        subquestion: true,
        type: "buttonGrid",
      };
    })
  )
  .concat([SymptomsLast48Config])
  .concat(
    WhatSymptomsConfig.optionList!.options.map(option => {
      return {
        ...SymptomsLast48Config,
        id: SymptomsLast48Config.id + "_" + option,
        buttons: [
          { key: "yes", primary: false, enabled: true },
          { key: "no", primary: false, enabled: true },
        ],
        description: option,
        condition: {
          key: "options",
          id: WhatSymptomsConfig.id,
          answer: option,
        },
        subquestion: true,
        type: "buttonGrid",
      };
    })
  )
  .concat([SymptomsSeverityConfig])
  .concat(
    WhatSymptomsConfig.optionList!.options.map(option => {
      return {
        ...SymptomsSeverityConfig,
        id: SymptomsSeverityConfig.id + "_" + option,
        buttons: [
          { key: "mild", primary: false, enabled: true },
          { key: "moderate", primary: false, enabled: true },
          { key: "severe", primary: false, enabled: true },
        ],
        description: option,
        condition: {
          key: "options",
          id: WhatSymptomsConfig.id,
          answer: option,
        },
        subquestion: true,
        type: "buttonGrid",
      };
    })
  );

export const InContactConfig: SurveyQuestionData = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true },
  ],
  id: "InContact",
  title: "inContact",
  type: "buttonGrid",
};

export const CoughSneezeConfig: SurveyQuestionData = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true },
  ],
  condition: {
    key: "selectedButtonKey",
    id: InContactConfig.id,
    answer: "yes",
  },
  id: "CoughSneeze",
  title: "coughSneeze",
  type: "buttonGrid",
};

export const HouseholdChildrenConfig: SurveyQuestionData = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true },
  ],
  id: "HouseholdChildren",
  title: "householdChildren",
  type: "buttonGrid",
};

export const ChildrenWithChildrenConfig: SurveyQuestionData = {
  id: "ChildrenWithChildren",
  title: "childrenWithChildren",
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true },
  ],
  condition: {
    key: "selectedButtonKey",
    id: HouseholdChildrenConfig.id,
    answer: "yes",
  },
  type: "buttonGrid",
};

export const GeneralExposureConfig = [
  InContactConfig,
  CoughSneezeConfig,
  {
    buttons: [
      { key: "noContactUnderFive", primary: false, enabled: true },
      { key: "oneChild", primary: false, enabled: true },
      { key: "twoToFiveChildren", primary: false, enabled: true },
      { key: "moreThanFiveChildren", primary: false, enabled: true },
      { key: "dontKnow", primary: false, enabled: true },
    ],
    id: "YoungChildren",
    title: "youngChildren",
    type: "radioGrid",
  },
  HouseholdChildrenConfig,
  ChildrenWithChildrenConfig,
  {
    buttons: [
      { key: "1to2", primary: false, enabled: true },
      { key: "3to4", primary: false, enabled: true },
      { key: "5to7", primary: false, enabled: true },
      { key: "8plus", primary: false, enabled: true },
    ],
    id: "PeopleInHousehold",
    title: "peopleInHousehold",
    type: "buttonGrid",
  },
  {
    buttons: [
      { key: "0-1", primary: false, enabled: true },
      { key: "2", primary: false, enabled: true },
      { key: "3", primary: false, enabled: true },
      { key: "4", primary: false, enabled: true },
      { key: "5+", primary: false, enabled: true },
    ],
    id: "Bedrooms",
    title: "bedrooms",
    type: "buttonGrid",
  },
];

export const FluShotConfig: SurveyQuestionData = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true },
  ],
  id: "FluShot",
  title: "fluShot",
  type: "buttonGrid",
};

const FLUSHOT_START_DATE = monthAsDate(
  new Date().getFullYear() - 1,
  new Date().getMonth()
);

export const FluShotDateConfig: SurveyQuestionData = {
  buttons: [],
  condition: { key: "selectedButtonKey", id: FluShotConfig.id, answer: "yes" },
  dateInput: true,
  id: "FluShotDate",
  startDate: FLUSHOT_START_DATE,
  title: "fluShotDate",
  type: "datePicker",
};

const FluShotNationalImmunization: SurveyQuestionData = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true },
  ],
  condition: { key: "selectedButtonKey", id: FluShotConfig.id, answer: "yes" },
  id: "FluShotNationalImmunization",
  title: "fluShotNationalImmunization",
  type: "buttonGrid",
};

const FluShotNationalImmunizationCondition: SurveyQuestionData = {
  buttons: [],
  condition: {
    key: "selectedButtonKey",
    id: FluShotNationalImmunization.id,
    answer: "yes",
  },
  id: "FluShotNationalImmunizationCondition",
  title: "fluShotNationalImmunizationCondition",
  type: "textInput",
};

const PreviousSeason: SurveyQuestionData = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true },
    { key: "neverFlu", primary: false, enabled: true },
  ],
  id: "PreviousSeason",
  title: "previousSeason",
  type: "radioGrid",
};

export const InfluenzaVaccinationConfig = [
  FluShotConfig,
  FluShotDateConfig,
  FluShotNationalImmunization,
  FluShotNationalImmunizationCondition,
  PreviousSeason,
];

export const AssignedSexConfig: SurveyQuestionData = {
  buttons: [
    { key: "male", primary: false, enabled: true },
    { key: "female", primary: false, enabled: true },
    { key: "indeterminate", primary: false, enabled: true },
    { key: "other", primary: false, enabled: true },
  ],
  id: "AssignedSex",
  title: "assignedSex",
  type: "radioGrid",
};

export const GeneralHealthConfig = [
  {
    buttons: [],
    description: "selectAll",
    id: "MedicalCondition",
    optionList: {
      multiSelect: true,
      options: [
        "asthma",
        "copd",
        "diabetes",
        "heartDisease",
        "noneOfThese",
        "doNotKnow",
      ],
      withOther: false,
      exclusiveOptions: ["noneOfThese", "doNotKnow"],
    },
    title: "medicalCondition",
    type: "optionQuestion",
  },
  {
    buttons: [
      { key: "yes", primary: false, enabled: true },
      { key: "no", primary: false, enabled: true },
      { key: "dontKnow", primary: false, enabled: true },
    ],
    id: "HealthcareWorker",
    title: "healthcareWorker",
    type: "buttonGrid",
  },
  {
    buttons: [
      { key: "yes", primary: false, enabled: true },
      { key: "no", primary: false, enabled: true },
    ],
    id: "SmokeTobacco",
    title: "smokeTobacco",
    type: "buttonGrid",
  },
  {
    buttons: [
      { key: "yes", primary: false, enabled: true },
      { key: "no", primary: false, enabled: true },
    ],
    id: "HouseholdTobacco",
    title: "householdTobacco",
    type: "buttonGrid",
  },
  {
    buttons: [
      { key: "yes", primary: false, enabled: true },
      { key: "no", primary: false, enabled: true },
    ],
    id: "Interfering",
    title: "interfering",
    type: "buttonGrid",
  },
  {
    buttons: [
      { key: "yes", primary: false, enabled: true },
      { key: "no", primary: false, enabled: true },
      { key: "dontKnow", primary: false, enabled: true },
    ],
    id: "Antibiotics",
    required: true,
    title: "antibiotics",
    type: "buttonGrid",
  },
  {
    buttons: [],
    optionList: {
      multiSelect: true,
      options: [
        "18to19",
        "20to24",
        "25to29",
        "30to34",
        "35to39",
        "40to44",
        "45to49",
        "50to54",
        "55to59",
        "60to64",
        "65to69",
        "70to74",
        "75to79",
        "80to84",
        "85to89",
        "90+",
      ],
      withOther: false,
      exclusiveOptions: ["noneOfThese", "doNotKnow"],
    },
    id: "Age",
    placeholder: "selectAge",
    title: "age",
    type: "dropdown",
  },
  AssignedSexConfig,
  {
    buttons: [],
    description: "selectAll",
    optionList: {
      options: [
        "aboriginal",
        "torresStraitIslander",
        "pacificIslander",
        "asian",
        "african",
        "european",
        "whiteAustralian",
        "southAndCentralAmerican",
        "middleEastNorthAfrican",
        "indianSubcontinent",
        "other",
      ],
      multiSelect: true,
      withOther: false,
    },
    id: "Race",
    title: "race",
    type: "optionQuestion",
  },
];

export const BlueLineConfig: SurveyQuestionData = {
  id: "BlueLine",
  title: "blueLine",
  description: "blueLine",
  buttons: [
    { key: "no", primary: false, enabled: true },
    { key: "yes", primary: false, enabled: true },
  ],
  required: true,
  type: "buttonGrid",
};

export const PinkWhenBlueConfig: SurveyQuestionData = {
  id: "PinkWhenBlue",
  condition: {
    key: "selectedButtonKey",
    id: BlueLineConfig.id,
    answer: "yes",
  },
  title: "pinkLine",
  description: "selectOne",
  buttons: [
    {
      key: "noPink",
      primary: false,
      enabled: true,
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
  type: "radioGrid",
};

export const PinkLineConfig: SurveyQuestionData = {
  id: "PinkLine",
  condition: {
    key: "selectedButtonKey",
    id: BlueLineConfig.id,
    answer: "no",
  },
  title: "pinkLine",
  description: "selectOne",
  buttons: [
    { key: "noPink", primary: false, enabled: true },
    { key: "yesOnePink", primary: false, enabled: true },
    { key: "yesTwoPink", primary: false, enabled: true },
  ],
  type: "radioGrid",
};

export const TestStripSurveyConfig = [
  BlueLineConfig,
  PinkWhenBlueConfig,
  PinkLineConfig,
];

export const TestFeedbackConfig: SurveyQuestionData = {
  id: "TestFeedback",
  title: "TestFeedback",
  description: "selectMostApplicable",
  buttons: [
    { key: "easyCorrect", primary: false, enabled: true },
    { key: "confusingCorrect", primary: false, enabled: true },
    { key: "confusingNotCorrect", primary: false, enabled: true },
    { key: "incorrect", primary: false, enabled: true },
  ],
  type: "radioGrid",
};
