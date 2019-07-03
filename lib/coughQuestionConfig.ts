// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export interface ButtonConfig {
  enabled: boolean;
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
  OptionQuestion = "optionQuestion",
  RadioGrid = "radioGrid",
  Text = "text",
  TextInput = "textInput"
}

export interface SurveyQuestion {
  buttons: ButtonConfig[];
  conditions?: ConditionalQuestionConfig[];
  description?: string;
  id: string;
  required?: boolean;
  subquestion?: boolean;
  title: string;
  type: SurveyQuestionType;
}

export interface OptionQuestion extends SurveyQuestion {
  inclusiveOption?: string;
  exclusiveOptions?: string[];
  options: string[];
}

export interface DropDownQuestion extends SurveyQuestion {
  placeholder: string;
}

// ================================================================
//
// NOTE: Please make sure, as you add questions, that all questions
// are included in the SURVEY_QUESTIONS array at the bottom of this
// file.
//
// ================================================================

export const ConsentConfig: SurveyQuestion[] = [
  {
    buttons: [
      { key: "yes", primary: false, enabled: true },
      { key: "no", primary: false, enabled: true }
    ],
    id: "ResearchByAnyResearchers",
    required: true,
    title: "researchByAnyResearchers",
    type: SurveyQuestionType.ButtonGrid
  }
];

export interface MonthQuestion extends SurveyQuestion {
  monthRange: number;
}

export const WhatSymptomsConfig: OptionQuestion = {
  buttons: [{ key: "next", primary: true, enabled: true }],
  description: "selectAll",
  id: "WhatSymptoms",
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
    "vomiting"
  ],
  required: true,
  title: "whatSymptoms",
  type: SurveyQuestionType.OptionQuestion
};

export const SymptomsStartConfig: SurveyQuestion = {
  id: "SymptomsStart",
  buttons: [],
  title: "symptomsStart",
  description: "symptomsStart",
  required: true,
  type: SurveyQuestionType.Text
};

export const FeverStartConfig: SurveyQuestion = {
  id: "SymptomsStart_feelingFeverish",
  buttons: [
    { key: "1day", primary: false, enabled: true },
    { key: "2days", primary: false, enabled: true },
    { key: "3days", primary: false, enabled: true },
    { key: "4days", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "feelingFeverish"
    }
  ],
  description: "feelingFeverish",
  required: true,
  subquestion: true,
  title: "symptomsStart",
  type: SurveyQuestionType.ButtonGrid
};

export const CoughStartConfig: SurveyQuestion = {
  id: "SymptomsStart_cough",
  buttons: [
    { key: "1day", primary: false, enabled: true },
    { key: "2days", primary: false, enabled: true },
    { key: "3days", primary: false, enabled: true },
    { key: "4days", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "cough"
    }
  ],
  description: "cough",
  required: true,
  subquestion: true,
  title: "symptomsStart",
  type: SurveyQuestionType.ButtonGrid
};

export const FatigueStartConfig: SurveyQuestion = {
  id: "SymptomsStart_fatigue",
  buttons: [
    { key: "1day", primary: false, enabled: true },
    { key: "2days", primary: false, enabled: true },
    { key: "3days", primary: false, enabled: true },
    { key: "4days", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "fatigue"
    }
  ],
  description: "fatigue",
  required: true,
  subquestion: true,
  title: "symptomsStart",
  type: SurveyQuestionType.ButtonGrid
};

export const ChillsStartConfig: SurveyQuestion = {
  id: "SymptomsStart_chillsOrSweats",
  buttons: [
    { key: "1day", primary: false, enabled: true },
    { key: "2days", primary: false, enabled: true },
    { key: "3days", primary: false, enabled: true },
    { key: "4days", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "chillsOrSweats"
    }
  ],
  description: "chillsOrSweats",
  required: true,
  subquestion: true,
  title: "symptomsStart",
  type: SurveyQuestionType.ButtonGrid
};

export const SoreThroatStartConfig: SurveyQuestion = {
  id: "SymptomsStart_soreThroat",
  buttons: [
    { key: "1day", primary: false, enabled: true },
    { key: "2days", primary: false, enabled: true },
    { key: "3days", primary: false, enabled: true },
    { key: "4days", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "soreThroat"
    }
  ],
  description: "soreThroat",
  required: true,
  subquestion: true,
  title: "symptomsStart",
  type: SurveyQuestionType.ButtonGrid
};

export const HeadacheStartConfig: SurveyQuestion = {
  id: "SymptomsStart_headache",
  buttons: [
    { key: "1day", primary: false, enabled: true },
    { key: "2days", primary: false, enabled: true },
    { key: "3days", primary: false, enabled: true },
    { key: "4days", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "headache"
    }
  ],
  description: "headache",
  required: true,
  subquestion: true,
  title: "symptomsStart",
  type: SurveyQuestionType.ButtonGrid
};

export const AchesStartConfig: SurveyQuestion = {
  id: "SymptomsStart_muscleOrBodyAches",
  buttons: [
    { key: "1day", primary: false, enabled: true },
    { key: "2days", primary: false, enabled: true },
    { key: "3days", primary: false, enabled: true },
    { key: "4days", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "muscleOrBodyAches"
    }
  ],
  description: "muscleOrBodyAches",
  required: true,
  subquestion: true,
  title: "symptomsStart",
  type: SurveyQuestionType.ButtonGrid
};

export const RunningNoseStartConfig: SurveyQuestion = {
  id: "SymptomsStart_runningNose",
  buttons: [
    { key: "1day", primary: false, enabled: true },
    { key: "2days", primary: false, enabled: true },
    { key: "3days", primary: false, enabled: true },
    { key: "4days", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "runningNose"
    }
  ],
  description: "runningNose",
  required: true,
  subquestion: true,
  title: "symptomsStart",
  type: SurveyQuestionType.ButtonGrid
};

export const ShortBreathStartConfig: SurveyQuestion = {
  id: "SymptomsStart_shortnessOfBreath",
  buttons: [
    { key: "1day", primary: false, enabled: true },
    { key: "2days", primary: false, enabled: true },
    { key: "3days", primary: false, enabled: true },
    { key: "4days", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "shortnessOfBreath"
    }
  ],
  description: "shortnessOfBreath",
  required: true,
  subquestion: true,
  title: "symptomsStart",
  type: SurveyQuestionType.ButtonGrid
};

export const VomitingStartConfig: SurveyQuestion = {
  id: "SymptomsStart_vomiting",
  buttons: [
    { key: "1day", primary: false, enabled: true },
    { key: "2days", primary: false, enabled: true },
    { key: "3days", primary: false, enabled: true },
    { key: "4days", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "vomiting"
    }
  ],
  description: "vomiting",
  required: true,
  subquestion: true,
  title: "symptomsStart",
  type: SurveyQuestionType.ButtonGrid
};

export const SymptomsLast48Config: SurveyQuestion = {
  id: "SymptomsLast48",
  buttons: [],
  title: "symptomsLast48",
  required: true,
  type: SurveyQuestionType.Text
};

export const FeverLast48Config: SurveyQuestion = {
  id: "SymptomsLast48_feelingFeverish",
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "feelingFeverish"
    }
  ],
  description: "feelingFeverish",
  required: true,
  subquestion: true,
  title: "symptomsLast48",
  type: SurveyQuestionType.ButtonGrid
};

export const CoughLast48Config: SurveyQuestion = {
  id: "SymptomsLast48_cough",
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "cough"
    }
  ],
  description: "cough",
  required: true,
  subquestion: true,
  title: "symptomsLast48",
  type: SurveyQuestionType.ButtonGrid
};

export const FatigueLast48Config: SurveyQuestion = {
  id: "SymptomsLast48_fatigue",
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "fatigue"
    }
  ],
  description: "fatigue",
  required: true,
  subquestion: true,
  title: "symptomsLast48",
  type: SurveyQuestionType.ButtonGrid
};

export const ChillsLast48Config: SurveyQuestion = {
  id: "SymptomsLast48_chillsOrSweats",
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "chillsOrSweats"
    }
  ],
  description: "chillsOrSweats",
  required: true,
  subquestion: true,
  title: "symptomsLast48",
  type: SurveyQuestionType.ButtonGrid
};

export const SoreThroatLast48Config: SurveyQuestion = {
  id: "SymptomsLast48_soreThroat",
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "soreThroat"
    }
  ],
  description: "soreThroat",
  required: true,
  subquestion: true,
  title: "symptomsLast48",
  type: SurveyQuestionType.ButtonGrid
};

export const HeadacheLast48Config: SurveyQuestion = {
  id: "SymptomsLast48_headache",
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "headache"
    }
  ],
  description: "headache",
  required: true,
  subquestion: true,
  title: "symptomsLast48",
  type: SurveyQuestionType.ButtonGrid
};

export const AchesLast48Config: SurveyQuestion = {
  id: "SymptomsLast48_muscleOrBodyAches",
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "muscleOrBodyAches"
    }
  ],
  description: "muscleOrBodyAches",
  required: true,
  subquestion: true,
  title: "symptomsLast48",
  type: SurveyQuestionType.ButtonGrid
};

export const RunningNoseLast48Config: SurveyQuestion = {
  id: "SymptomsLast48_runningNose",
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "runningNose"
    }
  ],
  description: "runningNose",
  required: true,
  subquestion: true,
  title: "symptomsLast48",
  type: SurveyQuestionType.ButtonGrid
};

export const ShortBreathLast48Config: SurveyQuestion = {
  id: "SymptomsLast48_shortnessOfBreath",
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "shortnessOfBreath"
    }
  ],
  description: "shortnessOfBreath",
  required: true,
  subquestion: true,
  title: "symptomsLast48",
  type: SurveyQuestionType.ButtonGrid
};

export const VomitingLast48Config: SurveyQuestion = {
  id: "SymptomsLast48_vomiting",
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "vomiting"
    }
  ],
  description: "vomiting",
  required: true,
  subquestion: true,
  title: "symptomsLast48",
  type: SurveyQuestionType.ButtonGrid
};

export const SymptomsSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity",
  buttons: [],
  title: "symptomsSeverity",
  description: "symptomsSeverity",
  required: true,
  type: SurveyQuestionType.Text
};

export const FeverSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_feelingFeverish",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "feelingFeverish"
    }
  ],
  description: "feelingFeverish",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid
};

export const CoughSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_cough",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "cough"
    }
  ],
  description: "cough",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid
};

export const FatigueSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_fatigue",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "fatigue"
    }
  ],
  description: "fatigue",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid
};

export const ChillsSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_chillsOrSweats",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "chillsOrSweats"
    }
  ],
  description: "chillsOrSweats",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid
};

export const SoreThroatSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_soreThroat",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "soreThroat"
    }
  ],
  description: "soreThroat",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid
};

export const HeadacheSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_headache",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "headache"
    }
  ],
  description: "headache",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid
};

export const AchesSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_muscleOrBodyAches",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "muscleOrBodyAches"
    }
  ],
  description: "muscleOrBodyAches",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid
};

export const RunningNoseSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_runningNose",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "runningNose"
    }
  ],
  description: "runningNose",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid
};

export const ShortBreathSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_shortnessOfBreath",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "shortnessOfBreath"
    }
  ],
  description: "shortnessOfBreath",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid
};

export const VomitingSeverityConfig: SurveyQuestion = {
  id: "SymptomsSeverity_vomiting",
  buttons: [
    { key: "mild", primary: false, enabled: true },
    { key: "moderate", primary: false, enabled: true },
    { key: "severe", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "options",
      id: WhatSymptomsConfig.id,
      answer: "vomiting"
    }
  ],
  description: "vomiting",
  required: true,
  subquestion: true,
  title: "symptomsSeverity",
  type: SurveyQuestionType.ButtonGrid
};

export const InContactConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true }
  ],
  id: "InContact",
  title: "inContact",
  type: SurveyQuestionType.ButtonGrid
};

export const CoughSneezeConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "selectedButtonKey",
      id: InContactConfig.id,
      answer: "yes"
    }
  ],
  id: "CoughSneeze",
  title: "coughSneeze",
  type: SurveyQuestionType.ButtonGrid
};

export const HouseholdChildrenConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true }
  ],
  id: "HouseholdChildren",
  title: "householdChildren",
  type: SurveyQuestionType.ButtonGrid
};

export const ChildrenWithChildrenConfig: SurveyQuestion = {
  id: "ChildrenWithChildren",
  title: "childrenWithChildren",
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "selectedButtonKey",
      id: HouseholdChildrenConfig.id,
      answer: "yes"
    }
  ],
  type: SurveyQuestionType.ButtonGrid
};

export const YoungChildrenConfig: SurveyQuestion = {
  buttons: [
    { key: "noContactUnderFive", primary: false, enabled: true },
    { key: "oneChild", primary: false, enabled: true },
    { key: "twoToFiveChildren", primary: false, enabled: true },
    { key: "moreThanFiveChildren", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true }
  ],
  id: "YoungChildren",
  title: "youngChildren",
  type: SurveyQuestionType.RadioGrid
};

export const PeopleInHouseholdConfig: SurveyQuestion = {
  buttons: [
    { key: "1to2", primary: false, enabled: true },
    { key: "3to4", primary: false, enabled: true },
    { key: "5to7", primary: false, enabled: true },
    { key: "8plus", primary: false, enabled: true }
  ],
  id: "PeopleInHousehold",
  title: "peopleInHousehold",
  type: SurveyQuestionType.ButtonGrid
};

export const BedroomsConfig: SurveyQuestion = {
  buttons: [
    { key: "0-1", primary: false, enabled: true },
    { key: "2", primary: false, enabled: true },
    { key: "3", primary: false, enabled: true },
    { key: "4", primary: false, enabled: true },
    { key: "5+", primary: false, enabled: true }
  ],
  id: "Bedrooms",
  title: "bedrooms",
  type: SurveyQuestionType.ButtonGrid
};

export const FluShotConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true },
    { key: "neverFlu", primary: false, enabled: true }
  ],
  id: "FluShot",
  title: "fluShot",
  type: SurveyQuestionType.RadioGrid
};

export const FluShotDateConfig: MonthQuestion = {
  buttons: [],
  conditions: [
    { key: "selectedButtonKey", id: FluShotConfig.id, answer: "yes" }
  ],
  id: "FluShotDate",
  monthRange: new Date().getMonth(),
  title: "fluShotDate",
  type: SurveyQuestionType.DatePicker
};

export const FluShotNationalImmunization: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true }
  ],
  conditions: [
    { key: "selectedButtonKey", id: FluShotConfig.id, answer: "yes" }
  ],
  id: "FluShotNationalImmunization",
  title: "fluShotNationalImmunization",
  type: SurveyQuestionType.ButtonGrid
};

export const FluShotNationalImmunizationCondition: SurveyQuestion = {
  buttons: [],
  conditions: [
    {
      key: "selectedButtonKey",
      id: FluShotConfig.id,
      answer: "yes"
    },
    {
      key: "selectedButtonKey",
      id: FluShotNationalImmunization.id,
      answer: "yes"
    }
  ],
  id: "FluShotNationalImmunizationCondition",
  title: "fluShotNationalImmunizationCondition",
  type: SurveyQuestionType.TextInput
};

export const PreviousSeason: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true }
  ],
  conditions: [
    {
      key: "selectedButtonKey",
      id: FluShotConfig.id,
      answer: "neverFlu",
      anythingBut: true
    }
  ],
  id: "PreviousSeason",
  title: "previousSeason",
  type: SurveyQuestionType.RadioGrid
};

export const AssignedSexConfig: SurveyQuestion = {
  buttons: [
    { key: "male", primary: false, enabled: true },
    { key: "female", primary: false, enabled: true },
    { key: "indeterminate", primary: false, enabled: true },
    { key: "preferNotToSay", primary: false, enabled: true }
  ],
  id: "AssignedSex",
  title: "assignedSex",
  type: SurveyQuestionType.RadioGrid
};

export const MedicalConditionConfig: OptionQuestion = {
  buttons: [],
  description: "selectAll",
  id: "MedicalCondition",
  options: [
    "asthma",
    "copd",
    "diabetes",
    "heartDisease",
    "noneOfThese",
    "dontKnow"
  ],
  exclusiveOptions: ["noneOfThese", "dontKnow"],
  title: "medicalCondition",
  type: SurveyQuestionType.OptionQuestion
};

export const HealthCareWorkerConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true }
  ],
  id: "HealthcareWorker",
  title: "healthcareWorker",
  type: SurveyQuestionType.ButtonGrid
};

export const SmokeTobaccoConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true }
  ],
  id: "SmokeTobacco",
  title: "smokeTobacco",
  type: SurveyQuestionType.ButtonGrid
};

export const HouseholdTobaccoConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true }
  ],
  id: "HouseholdTobacco",
  title: "householdTobacco",
  type: SurveyQuestionType.ButtonGrid
};

export const InterferingConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true }
  ],
  id: "Interfering",
  title: "interfering",
  type: SurveyQuestionType.ButtonGrid
};

export const AntibioticsConfig: SurveyQuestion = {
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true },
    { key: "dontKnow", primary: false, enabled: true }
  ],
  id: "Antibiotics",
  required: true,
  title: "antibiotics",
  type: SurveyQuestionType.ButtonGrid
};

export const AgeConfig: DropDownQuestion = {
  buttons: [
    { key: "18to19", primary: false, enabled: true },
    { key: "20to24", primary: false, enabled: true },
    { key: "25to29", primary: false, enabled: true },
    { key: "30to34", primary: false, enabled: true },
    { key: "35to39", primary: false, enabled: true },
    { key: "40to44", primary: false, enabled: true },
    { key: "45to49", primary: false, enabled: true },
    { key: "50to54", primary: false, enabled: true },
    { key: "55to59", primary: false, enabled: true },
    { key: "60to64", primary: false, enabled: true },
    { key: "65to69", primary: false, enabled: true },
    { key: "70to74", primary: false, enabled: true },
    { key: "75to79", primary: false, enabled: true },
    { key: "80to84", primary: false, enabled: true },
    { key: "85to89", primary: false, enabled: true },
    { key: "90+", primary: false, enabled: true }
  ],
  id: "Age",
  placeholder: "selectAge",
  title: "age",
  type: SurveyQuestionType.Dropdown
};

export const RaceConfig: OptionQuestion = {
  buttons: [],
  description: "selectAll",
  options: [
    "aboriginal",
    "torresStraitIslander",
    "pacificIslander",
    "asian",
    "african",
    "european",
    "whiteAustralian",
    "southOrCentralAmerican",
    "middleEastNorthAfrican",
    "indianSubcontinent",
    "other"
  ],
  id: "Race",
  title: "race",
  type: SurveyQuestionType.OptionQuestion
};

export const BlueLineConfig: SurveyQuestion = {
  id: "BlueLine",
  title: "blueLine",
  description: "blueLine",
  buttons: [
    { key: "yes", primary: false, enabled: true },
    { key: "no", primary: false, enabled: true }
  ],
  required: true,
  type: SurveyQuestionType.ButtonGrid
};

export const PinkWhenBlueConfig: SurveyQuestion = {
  id: "PinkWhenBlue",
  conditions: [
    {
      key: "selectedButtonKey",
      id: BlueLineConfig.id,
      answer: "yes"
    }
  ],
  title: "pinkLine",
  description: "selectOne",
  buttons: [
    {
      key: "noPink",
      primary: false,
      enabled: true
    },
    {
      key: "yesAboveBlue",
      primary: false,
      enabled: true,
      helpImageUri: "pinklineaboveblueline"
    },
    {
      key: "yesBelowBlue",
      primary: false,
      enabled: true,
      helpImageUri: "pinklinebelowblueline"
    },
    {
      key: "yesAboveBelowBlue",
      primary: false,
      enabled: true,
      helpImageUri: "pinklineabovebelow"
    }
  ],
  required: true,
  type: SurveyQuestionType.RadioGrid
};

export const PinkLineConfig: SurveyQuestion = {
  id: "PinkLine",
  conditions: [
    {
      key: "selectedButtonKey",
      id: BlueLineConfig.id,
      answer: "no"
    }
  ],
  title: "pinkLine",
  description: "selectOne",
  buttons: [
    { key: "noPink", primary: false, enabled: true },
    { key: "yesOnePink", primary: false, enabled: true },
    { key: "yesTwoPink", primary: false, enabled: true }
  ],
  type: SurveyQuestionType.RadioGrid
};

export const NumLinesSeenConfig: SurveyQuestion = {
  id: "NumLinesSeen",
  title: "numLinesSeen",
  description: "selectOne",
  buttons: [
    {
      key: "oneLine",
      primary: false,
      enabled: true,
      helpImageUri: "oneline"
    },
    {
      key: "twoLines",
      primary: false,
      enabled: true,
      helpImageUri: "twolines"
    },
    {
      key: "threeLines",
      primary: false,
      enabled: true,
      helpImageUri: "threelines"
    },
    {
      key: "noneOfTheAbove",
      primary: false,
      enabled: true
    }
  ],
  required: true,
  type: SurveyQuestionType.RadioGrid
};

export const TestFeedbackConfig: SurveyQuestion = {
  id: "TestFeedback",
  title: "TestFeedback",
  description: "selectMostApplicable",
  buttons: [
    { key: "easyCorrect", primary: false, enabled: true },
    { key: "confusingCorrect", primary: false, enabled: true },
    { key: "confusingNotCorrect", primary: false, enabled: true },
    { key: "incorrect", primary: false, enabled: true }
  ],
  type: SurveyQuestionType.RadioGrid
};

export const SURVEY_QUESTIONS = [
  ...ConsentConfig,
  WhatSymptomsConfig,
  SymptomsStartConfig,
  FeverStartConfig,
  CoughStartConfig,
  FatigueStartConfig,
  ChillsStartConfig,
  SoreThroatStartConfig,
  HeadacheStartConfig,
  AchesStartConfig,
  RunningNoseStartConfig,
  ShortBreathStartConfig,
  VomitingStartConfig,
  SymptomsLast48Config,
  FeverLast48Config,
  CoughLast48Config,
  FatigueLast48Config,
  ChillsLast48Config,
  SoreThroatLast48Config,
  HeadacheLast48Config,
  AchesLast48Config,
  RunningNoseLast48Config,
  ShortBreathLast48Config,
  VomitingLast48Config,
  SymptomsSeverityConfig,
  FeverSeverityConfig,
  CoughSeverityConfig,
  FatigueSeverityConfig,
  ChillsSeverityConfig,
  SoreThroatSeverityConfig,
  HeadacheSeverityConfig,
  AchesSeverityConfig,
  RunningNoseSeverityConfig,
  ShortBreathSeverityConfig,
  VomitingSeverityConfig,
  InContactConfig,
  CoughSneezeConfig,
  HouseholdChildrenConfig,
  ChildrenWithChildrenConfig,
  YoungChildrenConfig,
  PeopleInHouseholdConfig,
  BedroomsConfig,
  FluShotConfig,
  FluShotDateConfig,
  FluShotNationalImmunization,
  FluShotNationalImmunizationCondition,
  PreviousSeason,
  AssignedSexConfig,
  MedicalConditionConfig,
  HealthCareWorkerConfig,
  SmokeTobaccoConfig,
  HouseholdTobaccoConfig,
  InterferingConfig,
  AntibioticsConfig,
  AgeConfig,
  RaceConfig,
  BlueLineConfig,
  PinkWhenBlueConfig,
  PinkLineConfig,
  NumLinesSeenConfig,
  TestFeedbackConfig
];
