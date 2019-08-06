"use strict";
// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
exports.__esModule = true;
var SurveyQuestionType;
(function (SurveyQuestionType) {
    SurveyQuestionType["ButtonGrid"] = "buttonGrid";
    SurveyQuestionType["DatePicker"] = "datePicker";
    SurveyQuestionType["Dropdown"] = "dropdown";
    SurveyQuestionType["OptionQuestion"] = "optionQuestion";
    SurveyQuestionType["RadioGrid"] = "radioGrid";
    SurveyQuestionType["Text"] = "text";
    SurveyQuestionType["TextInput"] = "textInput";
})(SurveyQuestionType = exports.SurveyQuestionType || (exports.SurveyQuestionType = {}));
// ================================================================
//
// NOTE: Please make sure, as you add questions, that all questions
// are included in the SURVEY_QUESTIONS array at the bottom of this
// file.
//
// ================================================================
exports.ConsentSameResearchersConfig = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true }
    ],
    id: "ResearchBySameResearchers",
    required: true,
    title: "researchBySameResearchers",
    type: SurveyQuestionType.ButtonGrid
};
exports.WhatSymptomsConfig = {
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
exports.SymptomsStartConfig = {
    id: "SymptomsStart",
    buttons: [],
    title: "symptomsStart",
    description: "symptomsStart",
    required: true,
    type: SurveyQuestionType.Text
};
exports.FeverStartConfig = {
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
            id: exports.WhatSymptomsConfig.id,
            answer: "feelingFeverish"
        }
    ],
    description: "feelingFeverish",
    required: true,
    subquestion: true,
    title: "symptomsStart",
    type: SurveyQuestionType.ButtonGrid
};
exports.CoughStartConfig = {
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
            id: exports.WhatSymptomsConfig.id,
            answer: "cough"
        }
    ],
    description: "cough",
    required: true,
    subquestion: true,
    title: "symptomsStart",
    type: SurveyQuestionType.ButtonGrid
};
exports.FatigueStartConfig = {
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
            id: exports.WhatSymptomsConfig.id,
            answer: "fatigue"
        }
    ],
    description: "fatigue",
    required: true,
    subquestion: true,
    title: "symptomsStart",
    type: SurveyQuestionType.ButtonGrid
};
exports.ChillsStartConfig = {
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
            id: exports.WhatSymptomsConfig.id,
            answer: "chillsOrSweats"
        }
    ],
    description: "chillsOrSweats",
    required: true,
    subquestion: true,
    title: "symptomsStart",
    type: SurveyQuestionType.ButtonGrid
};
exports.SoreThroatStartConfig = {
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
            id: exports.WhatSymptomsConfig.id,
            answer: "soreThroat"
        }
    ],
    description: "soreThroat",
    required: true,
    subquestion: true,
    title: "symptomsStart",
    type: SurveyQuestionType.ButtonGrid
};
exports.HeadacheStartConfig = {
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
            id: exports.WhatSymptomsConfig.id,
            answer: "headache"
        }
    ],
    description: "headache",
    required: true,
    subquestion: true,
    title: "symptomsStart",
    type: SurveyQuestionType.ButtonGrid
};
exports.AchesStartConfig = {
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
            id: exports.WhatSymptomsConfig.id,
            answer: "muscleOrBodyAches"
        }
    ],
    description: "muscleOrBodyAches",
    required: true,
    subquestion: true,
    title: "symptomsStart",
    type: SurveyQuestionType.ButtonGrid
};
exports.RunningNoseStartConfig = {
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
            id: exports.WhatSymptomsConfig.id,
            answer: "runningNose"
        }
    ],
    description: "runningNose",
    required: true,
    subquestion: true,
    title: "symptomsStart",
    type: SurveyQuestionType.ButtonGrid
};
exports.ShortBreathStartConfig = {
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
            id: exports.WhatSymptomsConfig.id,
            answer: "shortnessOfBreath"
        }
    ],
    description: "shortnessOfBreath",
    required: true,
    subquestion: true,
    title: "symptomsStart",
    type: SurveyQuestionType.ButtonGrid
};
exports.VomitingStartConfig = {
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
            id: exports.WhatSymptomsConfig.id,
            answer: "vomiting"
        }
    ],
    description: "vomiting",
    required: true,
    subquestion: true,
    title: "symptomsStart",
    type: SurveyQuestionType.ButtonGrid
};
exports.SymptomsLast48Config = {
    id: "SymptomsLast48",
    buttons: [],
    title: "symptomsLast48",
    required: true,
    type: SurveyQuestionType.Text
};
exports.FeverLast48Config = {
    id: "SymptomsLast48_feelingFeverish",
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "feelingFeverish"
        }
    ],
    description: "feelingFeverish",
    required: true,
    subquestion: true,
    title: "symptomsLast48",
    type: SurveyQuestionType.ButtonGrid
};
exports.CoughLast48Config = {
    id: "SymptomsLast48_cough",
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "cough"
        }
    ],
    description: "cough",
    required: true,
    subquestion: true,
    title: "symptomsLast48",
    type: SurveyQuestionType.ButtonGrid
};
exports.FatigueLast48Config = {
    id: "SymptomsLast48_fatigue",
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "fatigue"
        }
    ],
    description: "fatigue",
    required: true,
    subquestion: true,
    title: "symptomsLast48",
    type: SurveyQuestionType.ButtonGrid
};
exports.ChillsLast48Config = {
    id: "SymptomsLast48_chillsOrSweats",
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "chillsOrSweats"
        }
    ],
    description: "chillsOrSweats",
    required: true,
    subquestion: true,
    title: "symptomsLast48",
    type: SurveyQuestionType.ButtonGrid
};
exports.SoreThroatLast48Config = {
    id: "SymptomsLast48_soreThroat",
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "soreThroat"
        }
    ],
    description: "soreThroat",
    required: true,
    subquestion: true,
    title: "symptomsLast48",
    type: SurveyQuestionType.ButtonGrid
};
exports.HeadacheLast48Config = {
    id: "SymptomsLast48_headache",
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "headache"
        }
    ],
    description: "headache",
    required: true,
    subquestion: true,
    title: "symptomsLast48",
    type: SurveyQuestionType.ButtonGrid
};
exports.AchesLast48Config = {
    id: "SymptomsLast48_muscleOrBodyAches",
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "muscleOrBodyAches"
        }
    ],
    description: "muscleOrBodyAches",
    required: true,
    subquestion: true,
    title: "symptomsLast48",
    type: SurveyQuestionType.ButtonGrid
};
exports.RunningNoseLast48Config = {
    id: "SymptomsLast48_runningNose",
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "runningNose"
        }
    ],
    description: "runningNose",
    required: true,
    subquestion: true,
    title: "symptomsLast48",
    type: SurveyQuestionType.ButtonGrid
};
exports.ShortBreathLast48Config = {
    id: "SymptomsLast48_shortnessOfBreath",
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "shortnessOfBreath"
        }
    ],
    description: "shortnessOfBreath",
    required: true,
    subquestion: true,
    title: "symptomsLast48",
    type: SurveyQuestionType.ButtonGrid
};
exports.VomitingLast48Config = {
    id: "SymptomsLast48_vomiting",
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "vomiting"
        }
    ],
    description: "vomiting",
    required: true,
    subquestion: true,
    title: "symptomsLast48",
    type: SurveyQuestionType.ButtonGrid
};
exports.SymptomsSeverityConfig = {
    id: "SymptomsSeverity",
    buttons: [],
    title: "symptomsSeverity",
    description: "symptomsSeverity",
    required: true,
    type: SurveyQuestionType.Text
};
exports.FeverSeverityConfig = {
    id: "SymptomsSeverity_feelingFeverish",
    buttons: [
        { key: "mild", primary: false, enabled: true },
        { key: "moderate", primary: false, enabled: true },
        { key: "severe", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "feelingFeverish"
        }
    ],
    description: "feelingFeverish",
    required: true,
    subquestion: true,
    title: "symptomsSeverity",
    type: SurveyQuestionType.ButtonGrid
};
exports.CoughSeverityConfig = {
    id: "SymptomsSeverity_cough",
    buttons: [
        { key: "mild", primary: false, enabled: true },
        { key: "moderate", primary: false, enabled: true },
        { key: "severe", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "cough"
        }
    ],
    description: "cough",
    required: true,
    subquestion: true,
    title: "symptomsSeverity",
    type: SurveyQuestionType.ButtonGrid
};
exports.FatigueSeverityConfig = {
    id: "SymptomsSeverity_fatigue",
    buttons: [
        { key: "mild", primary: false, enabled: true },
        { key: "moderate", primary: false, enabled: true },
        { key: "severe", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "fatigue"
        }
    ],
    description: "fatigue",
    required: true,
    subquestion: true,
    title: "symptomsSeverity",
    type: SurveyQuestionType.ButtonGrid
};
exports.ChillsSeverityConfig = {
    id: "SymptomsSeverity_chillsOrSweats",
    buttons: [
        { key: "mild", primary: false, enabled: true },
        { key: "moderate", primary: false, enabled: true },
        { key: "severe", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "chillsOrSweats"
        }
    ],
    description: "chillsOrSweats",
    required: true,
    subquestion: true,
    title: "symptomsSeverity",
    type: SurveyQuestionType.ButtonGrid
};
exports.SoreThroatSeverityConfig = {
    id: "SymptomsSeverity_soreThroat",
    buttons: [
        { key: "mild", primary: false, enabled: true },
        { key: "moderate", primary: false, enabled: true },
        { key: "severe", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "soreThroat"
        }
    ],
    description: "soreThroat",
    required: true,
    subquestion: true,
    title: "symptomsSeverity",
    type: SurveyQuestionType.ButtonGrid
};
exports.HeadacheSeverityConfig = {
    id: "SymptomsSeverity_headache",
    buttons: [
        { key: "mild", primary: false, enabled: true },
        { key: "moderate", primary: false, enabled: true },
        { key: "severe", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "headache"
        }
    ],
    description: "headache",
    required: true,
    subquestion: true,
    title: "symptomsSeverity",
    type: SurveyQuestionType.ButtonGrid
};
exports.AchesSeverityConfig = {
    id: "SymptomsSeverity_muscleOrBodyAches",
    buttons: [
        { key: "mild", primary: false, enabled: true },
        { key: "moderate", primary: false, enabled: true },
        { key: "severe", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "muscleOrBodyAches"
        }
    ],
    description: "muscleOrBodyAches",
    required: true,
    subquestion: true,
    title: "symptomsSeverity",
    type: SurveyQuestionType.ButtonGrid
};
exports.RunningNoseSeverityConfig = {
    id: "SymptomsSeverity_runningNose",
    buttons: [
        { key: "mild", primary: false, enabled: true },
        { key: "moderate", primary: false, enabled: true },
        { key: "severe", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "runningNose"
        }
    ],
    description: "runningNose",
    required: true,
    subquestion: true,
    title: "symptomsSeverity",
    type: SurveyQuestionType.ButtonGrid
};
exports.ShortBreathSeverityConfig = {
    id: "SymptomsSeverity_shortnessOfBreath",
    buttons: [
        { key: "mild", primary: false, enabled: true },
        { key: "moderate", primary: false, enabled: true },
        { key: "severe", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "shortnessOfBreath"
        }
    ],
    description: "shortnessOfBreath",
    required: true,
    subquestion: true,
    title: "symptomsSeverity",
    type: SurveyQuestionType.ButtonGrid
};
exports.VomitingSeverityConfig = {
    id: "SymptomsSeverity_vomiting",
    buttons: [
        { key: "mild", primary: false, enabled: true },
        { key: "moderate", primary: false, enabled: true },
        { key: "severe", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "vomiting"
        }
    ],
    description: "vomiting",
    required: true,
    subquestion: true,
    title: "symptomsSeverity",
    type: SurveyQuestionType.ButtonGrid
};
exports.InContactConfig = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true },
        { key: "dontKnow", primary: false, enabled: true }
    ],
    id: "InContact",
    title: "inContact",
    type: SurveyQuestionType.ButtonGrid
};
exports.CoughSneezeConfig = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true },
        { key: "dontKnow", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "selectedButtonKey",
            id: exports.InContactConfig.id,
            answer: "yes"
        }
    ],
    id: "CoughSneeze",
    title: "coughSneeze",
    type: SurveyQuestionType.ButtonGrid
};
exports.HouseholdChildrenConfig = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true },
        { key: "dontKnow", primary: false, enabled: true }
    ],
    id: "HouseholdChildren",
    title: "householdChildren",
    type: SurveyQuestionType.ButtonGrid
};
exports.ChildrenWithChildrenConfig = {
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
            id: exports.HouseholdChildrenConfig.id,
            answer: "yes"
        }
    ],
    type: SurveyQuestionType.ButtonGrid
};
exports.YoungChildrenConfig = {
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
exports.PeopleInHouseholdConfig = {
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
exports.BedroomsConfig = {
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
exports.FluShotConfig = {
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
exports.FluShotDateConfig = {
    buttons: [],
    conditions: [
        { key: "selectedButtonKey", id: exports.FluShotConfig.id, answer: "yes" }
    ],
    id: "FluShotDate",
    monthRange: new Date().getMonth(),
    title: "fluShotDate",
    type: SurveyQuestionType.DatePicker
};
exports.FluShotNationalImmunization = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true },
        { key: "dontKnow", primary: false, enabled: true }
    ],
    conditions: [
        { key: "selectedButtonKey", id: exports.FluShotConfig.id, answer: "yes" }
    ],
    id: "FluShotNationalImmunization",
    title: "fluShotNationalImmunization",
    type: SurveyQuestionType.ButtonGrid
};
exports.FluShotNationalImmunizationCondition = {
    buttons: [],
    conditions: [
        {
            key: "selectedButtonKey",
            id: exports.FluShotConfig.id,
            answer: "yes"
        },
        {
            key: "selectedButtonKey",
            id: exports.FluShotNationalImmunization.id,
            answer: "yes"
        }
    ],
    id: "FluShotNationalImmunizationCondition",
    title: "fluShotNationalImmunizationCondition",
    type: SurveyQuestionType.TextInput
};
exports.PreviousSeason = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true },
        { key: "dontKnow", primary: false, enabled: true }
    ],
    conditions: [
        {
            key: "selectedButtonKey",
            id: exports.FluShotConfig.id,
            answer: "neverFlu",
            anythingBut: true
        }
    ],
    id: "PreviousSeason",
    title: "previousSeason",
    type: SurveyQuestionType.RadioGrid
};
exports.AssignedSexConfig = {
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
exports.MedicalConditionConfig = {
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
exports.HealthCareWorkerConfig = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true },
        { key: "dontKnow", primary: false, enabled: true }
    ],
    id: "HealthcareWorker",
    title: "healthcareWorker",
    type: SurveyQuestionType.ButtonGrid
};
exports.SmokeTobaccoConfig = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true }
    ],
    id: "SmokeTobacco",
    title: "smokeTobacco",
    type: SurveyQuestionType.ButtonGrid
};
exports.HouseholdTobaccoConfig = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true }
    ],
    id: "HouseholdTobacco",
    title: "householdTobacco",
    type: SurveyQuestionType.ButtonGrid
};
exports.InterferingConfig = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true }
    ],
    id: "Interfering",
    title: "interfering",
    type: SurveyQuestionType.ButtonGrid
};
exports.AntibioticsConfig = {
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
exports.AgeConfig = {
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
exports.RaceConfig = {
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
exports.BlueLineConfig = {
    id: "BlueLine",
    title: "blueLine",
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true }
    ],
    required: true,
    type: SurveyQuestionType.ButtonGrid
};
exports.PinkWhenBlueConfig = {
    id: "PinkWhenBlue",
    conditions: [
        {
            key: "selectedButtonKey",
            id: exports.BlueLineConfig.id,
            answer: "yes"
        }
    ],
    title: "pinkLine",
    buttons: [
        {
            key: "noPink",
            primary: false,
            enabled: true,
            helpImageUri: "blueonly"
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
exports.PinkLineConfig = {
    id: "PinkLine",
    conditions: [
        {
            key: "selectedButtonKey",
            id: exports.BlueLineConfig.id,
            answer: "no"
        }
    ],
    title: "pinkLine",
    description: "seeExample",
    buttons: [
        { key: "noPink", primary: false, enabled: true },
        { key: "yesOnePink", primary: false, enabled: true },
        { key: "yesTwoPink", primary: false, enabled: true }
    ],
    type: SurveyQuestionType.RadioGrid
};
exports.NumLinesSeenConfig = {
    id: "NumLinesSeen",
    title: "numLinesSeen",
    description: "seeExample",
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
exports.TestFeedbackConfig = {
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
exports.SURVEY_QUESTIONS = [
    exports.ConsentSameResearchersConfig,
    exports.WhatSymptomsConfig,
    exports.SymptomsStartConfig,
    exports.FeverStartConfig,
    exports.CoughStartConfig,
    exports.FatigueStartConfig,
    exports.ChillsStartConfig,
    exports.SoreThroatStartConfig,
    exports.HeadacheStartConfig,
    exports.AchesStartConfig,
    exports.RunningNoseStartConfig,
    exports.ShortBreathStartConfig,
    exports.VomitingStartConfig,
    exports.SymptomsLast48Config,
    exports.FeverLast48Config,
    exports.CoughLast48Config,
    exports.FatigueLast48Config,
    exports.ChillsLast48Config,
    exports.SoreThroatLast48Config,
    exports.HeadacheLast48Config,
    exports.AchesLast48Config,
    exports.RunningNoseLast48Config,
    exports.ShortBreathLast48Config,
    exports.VomitingLast48Config,
    exports.SymptomsSeverityConfig,
    exports.FeverSeverityConfig,
    exports.CoughSeverityConfig,
    exports.FatigueSeverityConfig,
    exports.ChillsSeverityConfig,
    exports.SoreThroatSeverityConfig,
    exports.HeadacheSeverityConfig,
    exports.AchesSeverityConfig,
    exports.RunningNoseSeverityConfig,
    exports.ShortBreathSeverityConfig,
    exports.VomitingSeverityConfig,
    exports.InContactConfig,
    exports.CoughSneezeConfig,
    exports.HouseholdChildrenConfig,
    exports.ChildrenWithChildrenConfig,
    exports.YoungChildrenConfig,
    exports.PeopleInHouseholdConfig,
    exports.BedroomsConfig,
    exports.FluShotConfig,
    exports.FluShotDateConfig,
    exports.FluShotNationalImmunization,
    exports.FluShotNationalImmunizationCondition,
    exports.PreviousSeason,
    exports.AssignedSexConfig,
    exports.MedicalConditionConfig,
    exports.HealthCareWorkerConfig,
    exports.SmokeTobaccoConfig,
    exports.HouseholdTobaccoConfig,
    exports.InterferingConfig,
    exports.AntibioticsConfig,
    exports.AgeConfig,
    exports.RaceConfig,
    exports.BlueLineConfig,
    exports.PinkWhenBlueConfig,
    exports.PinkLineConfig,
    exports.NumLinesSeenConfig,
    exports.TestFeedbackConfig
];
