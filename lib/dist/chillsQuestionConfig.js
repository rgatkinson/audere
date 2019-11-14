"use strict";
// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
exports.__esModule = true;
var chillsQuestionData_1 = require("./chillsQuestionData");
var SurveyQuestionType;
(function (SurveyQuestionType) {
    SurveyQuestionType["ButtonGrid"] = "buttonGrid";
    SurveyQuestionType["DatePicker"] = "datePicker";
    SurveyQuestionType["Dropdown"] = "dropdown";
    SurveyQuestionType["MonthPicker"] = "monthPicker";
    SurveyQuestionType["MultiDropdown"] = "multiDropdown";
    SurveyQuestionType["OptionQuestion"] = "optionQuestion";
    SurveyQuestionType["RadioGrid"] = "radioGrid";
    SurveyQuestionType["Text"] = "text";
    SurveyQuestionType["TextInput"] = "textInput";
    SurveyQuestionType["ZipCodeInput"] = "zipCodeInput";
})(SurveyQuestionType = exports.SurveyQuestionType || (exports.SurveyQuestionType = {}));
// ================================================================
//
// NOTE: Please make sure, as you add questions, that all questions
// are included in the SURVEY_QUESTIONS array at the bottom of this
// file.
//
// ================================================================
exports.WhatSymptomsConfig = {
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
    type: SurveyQuestionType.OptionQuestion
};
exports.SymptomsSeverityConfig = {
    id: "SymptomsSeverity",
    buttons: [],
    conditions: [
        {
            key: "selectedButtonKey",
            id: exports.WhatSymptomsConfig.id,
            answer: "noneOfTheAbove",
            anythingBut: true
        },
    ],
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
        { key: "severe", primary: false, enabled: true },
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "feelingFeverish"
        },
    ],
    description: "feelingFeverish",
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
        { key: "severe", primary: false, enabled: true },
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "headache"
        },
    ],
    description: "headache",
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
        { key: "severe", primary: false, enabled: true },
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "cough"
        },
    ],
    description: "cough",
    required: true,
    subquestion: true,
    title: "symptomsSeverity",
    type: SurveyQuestionType.ButtonGrid
};
exports.ChillsSeverityConfig = {
    id: "SymptomsSeverity_chillsOrShivering",
    buttons: [
        { key: "mild", primary: false, enabled: true },
        { key: "moderate", primary: false, enabled: true },
        { key: "severe", primary: false, enabled: true },
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "chillsOrShivering"
        },
    ],
    description: "chillsOrShivering",
    required: true,
    subquestion: true,
    title: "symptomsSeverity",
    type: SurveyQuestionType.ButtonGrid
};
exports.SweatsSeverityConfig = {
    id: "SymptomsSeverity_sweats",
    buttons: [
        { key: "mild", primary: false, enabled: true },
        { key: "moderate", primary: false, enabled: true },
        { key: "severe", primary: false, enabled: true },
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "sweats"
        },
    ],
    description: "sweats",
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
        { key: "severe", primary: false, enabled: true },
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "soreThroat"
        },
    ],
    description: "soreThroat",
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
        { key: "severe", primary: false, enabled: true },
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "vomiting"
        },
    ],
    description: "vomiting",
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
        { key: "severe", primary: false, enabled: true },
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "runningNose"
        },
    ],
    description: "runningNose",
    required: true,
    subquestion: true,
    title: "symptomsSeverity",
    type: SurveyQuestionType.ButtonGrid
};
exports.SneezingSeverityConfig = {
    id: "SymptomsSeverity_sneezing",
    buttons: [
        { key: "mild", primary: false, enabled: true },
        { key: "moderate", primary: false, enabled: true },
        { key: "severe", primary: false, enabled: true },
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "sneezing"
        },
    ],
    description: "sneezing",
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
        { key: "severe", primary: false, enabled: true },
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "fatigue"
        },
    ],
    description: "fatigue",
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
        { key: "severe", primary: false, enabled: true },
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "muscleOrBodyAches"
        },
    ],
    description: "muscleOrBodyAches",
    required: true,
    subquestion: true,
    title: "symptomsSeverity",
    type: SurveyQuestionType.ButtonGrid
};
exports.TroubleBreathingSeverityConfig = {
    id: "SymptomsSeverity_troubleBreathing",
    buttons: [
        { key: "mild", primary: false, enabled: true },
        { key: "moderate", primary: false, enabled: true },
        { key: "severe", primary: false, enabled: true },
    ],
    conditions: [
        {
            key: "options",
            id: exports.WhatSymptomsConfig.id,
            answer: "troubleBreathing"
        },
    ],
    description: "troubleBreathing",
    required: true,
    subquestion: true,
    title: "symptomsSeverity",
    type: SurveyQuestionType.ButtonGrid
};
exports.WhenFirstNoticedIllnessConfig = {
    buttons: [],
    id: "WhenFirstNoticedIllness",
    required: true,
    title: "whenFirstNoticedIllness",
    type: SurveyQuestionType.DatePicker
};
exports.HowLongToSickestConfig = {
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
    type: SurveyQuestionType.RadioGrid
};
exports.FluOrColdConfig = {
    buttons: [
        { key: "flu", primary: false, enabled: true },
        { key: "commonCold", primary: false, enabled: true },
        { key: "anotherIllness", primary: false, enabled: true },
    ],
    id: "FluOrCold",
    title: "fluOrCold",
    type: SurveyQuestionType.RadioGrid
};
exports.WorseOrDifferentFromTypicalConfig = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true },
    ],
    id: "WorseOrDifferentFromTypical",
    title: "worseOrDifferentFromTypical",
    type: SurveyQuestionType.RadioGrid
};
exports.AntiviralConfig = {
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
    type: SurveyQuestionType.RadioGrid
};
exports.WhenFirstStartedAntiviralConfig = {
    buttons: [],
    conditions: [
        {
            key: "selectedButtonKey",
            id: exports.AntiviralConfig.id,
            answer: "no",
            anythingBut: true
        },
        {
            key: "selectedButtonKey",
            id: exports.AntiviralConfig.id,
            answer: "dontKnow",
            anythingBut: true
        },
    ],
    id: "WhenFirstStartedAntiviral",
    required: true,
    title: "whenFirstStartedAntiviral",
    type: SurveyQuestionType.DatePicker
};
exports.FluShotConfig = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true },
        { key: "dontKnow", primary: false, enabled: true },
    ],
    id: "FluShot",
    required: true,
    title: "fluShot",
    type: SurveyQuestionType.RadioGrid
};
exports.FluShotDateConfig = {
    buttons: [],
    conditions: [
        { key: "selectedButtonKey", id: exports.FluShotConfig.id, answer: "yes" },
    ],
    id: "FluShotDate",
    minDate: new Date(2019, 6, 1),
    required: true,
    title: "fluShotDate",
    type: SurveyQuestionType.DatePicker
};
exports.HowReceivedFluShotConfig = {
    buttons: [
        { key: "injection", primary: false, enabled: true },
        { key: "nasalSpray", primary: false, enabled: true },
        { key: "dontKnow", primary: false, enabled: true },
    ],
    conditions: [
        { key: "selectedButtonKey", id: exports.FluShotConfig.id, answer: "yes" },
    ],
    id: "HowReceivedFluShot",
    required: true,
    title: "howReceivedFluShot",
    type: SurveyQuestionType.RadioGrid
};
exports.AffectedRegularActivitiesConfig = {
    buttons: [
        { key: "notAtAll", primary: false, enabled: true },
        { key: "aLittleBit", primary: false, enabled: true },
        { key: "somewhat", primary: false, enabled: true },
        { key: "quiteABit", primary: false, enabled: true },
        { key: "veryMuch", primary: false, enabled: true },
    ],
    id: "AffectedRegularActivities",
    title: "affectedRegularActivities",
    type: SurveyQuestionType.RadioGrid
};
exports.SmokeTobaccoConfig = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true },
    ],
    id: "SmokeTobacco",
    title: "smokeTobacco",
    type: SurveyQuestionType.RadioGrid
};
exports.HouseholdTobaccoConfig = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true },
    ],
    id: "HouseholdTobacco",
    title: "householdTobacco",
    type: SurveyQuestionType.RadioGrid
};
exports.TravelOutsideStateConfig = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true },
    ],
    id: "TravelOutsideState",
    required: true,
    title: "travelOutsideState",
    type: SurveyQuestionType.RadioGrid
};
exports.TravelOutsideUSConfig = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true },
    ],
    conditions: [
        {
            key: "selectedButtonKey",
            id: exports.TravelOutsideStateConfig.id,
            answer: "yes"
        },
    ],
    id: "TravelOutsideUS",
    required: true,
    title: "travelOutsideUS",
    type: SurveyQuestionType.RadioGrid
};
exports.SpentTimeCityConfig = {
    buttons: [],
    conditions: [
        [
            {
                key: "selectedButtonKey",
                id: exports.TravelOutsideStateConfig.id,
                answer: "no"
            },
        ],
        [
            {
                key: "selectedButtonKey",
                id: exports.TravelOutsideStateConfig.id,
                answer: "yes"
            },
            {
                key: "selectedButtonKey",
                id: exports.TravelOutsideUSConfig.id,
                answer: "no"
            },
        ],
    ],
    id: "SpentTimeCity",
    placeholder: "enterCity",
    required: true,
    title: "spentTimeCity",
    type: SurveyQuestionType.TextInput
};
exports.SpentTimeStateConfig = {
    buttons: chillsQuestionData_1.STATE_DROPDOWN_DATA,
    conditions: [
        [
            {
                key: "selectedButtonKey",
                id: exports.TravelOutsideStateConfig.id,
                answer: "no"
            },
        ],
        [
            {
                key: "selectedButtonKey",
                id: exports.TravelOutsideStateConfig.id,
                answer: "yes"
            },
            {
                key: "selectedButtonKey",
                id: exports.TravelOutsideUSConfig.id,
                answer: "no"
            },
        ],
    ],
    id: "SpentTimeState",
    placeholder: "selectState",
    required: true,
    type: SurveyQuestionType.Dropdown
};
exports.SpentTimeZipCodeConfig = {
    buttons: [],
    conditions: [
        [
            {
                key: "selectedButtonKey",
                id: exports.TravelOutsideStateConfig.id,
                answer: "no"
            },
        ],
        [
            {
                key: "selectedButtonKey",
                id: exports.TravelOutsideStateConfig.id,
                answer: "yes"
            },
            {
                key: "selectedButtonKey",
                id: exports.TravelOutsideUSConfig.id,
                answer: "no"
            },
        ],
    ],
    id: "SpentTimeZipCode",
    placeholder: "enterZip",
    required: true,
    type: SurveyQuestionType.ZipCodeInput
};
exports.WhichCountriesOutsideUSConfig = {
    buttons: [],
    conditions: [
        {
            key: "selectedButtonKey",
            id: exports.TravelOutsideStateConfig.id,
            answer: "yes"
        },
        {
            key: "selectedButtonKey",
            id: exports.TravelOutsideUSConfig.id,
            answer: "yes"
        },
    ],
    id: "WhichCountriesOutsideUS",
    options: chillsQuestionData_1.COUNTRY_MULTIDROPDOWN_DATA,
    placeholder: "selectCountries",
    title: "whichCountriesOutsideUS",
    type: SurveyQuestionType.MultiDropdown
};
exports.PeopleInHouseholdConfig = {
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
    type: SurveyQuestionType.RadioGrid
};
exports.ChildrenAgeGroupsConfig = {
    buttons: [{ key: "next", primary: true, enabled: true }],
    conditions: [
        {
            key: "selectedButtonKey",
            id: exports.PeopleInHouseholdConfig.id,
            answer: "liveByMyself",
            anythingBut: true
        },
    ],
    description: "selectAll",
    id: "ChildrenAgeGroups",
    options: ["noChildren", "zeroToFive", "sixToTwelve", "olderThanTwelve"],
    exclusiveOptions: ["noChildren"],
    title: "childrenAgeGroups",
    type: SurveyQuestionType.OptionQuestion
};
exports.ChildrenDaycarePreschoolConfig = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true },
    ],
    conditions: [
        {
            key: "selectedButtonKey",
            id: exports.PeopleInHouseholdConfig.id,
            answer: "liveByMyself",
            anythingBut: true
        },
        {
            key: "options",
            id: exports.ChildrenAgeGroupsConfig.id,
            answer: "zeroToFive"
        },
    ],
    id: "ChildrenDaycarePreschool",
    title: "childrenDaycarePreschool",
    type: SurveyQuestionType.RadioGrid
};
exports.SomeoneDiagnosedConfig = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true },
        { key: "dontKnow", primary: false, enabled: true },
    ],
    conditions: [
        {
            key: "selectedButtonKey",
            id: exports.PeopleInHouseholdConfig.id,
            answer: "liveByMyself",
            anythingBut: true
        },
    ],
    id: "SomeoneDiagnosed",
    title: "someoneDiagnosed",
    type: SurveyQuestionType.RadioGrid
};
exports.InContactConfig = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true },
        { key: "dontKnow", primary: false, enabled: true },
    ],
    id: "InContact",
    title: "inContact",
    type: SurveyQuestionType.RadioGrid
};
exports.PublicTransportationConfig = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true },
    ],
    id: "PublicTransportation",
    title: "publicTransportation",
    type: SurveyQuestionType.RadioGrid
};
exports.AroundSickChildrenConfig = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true },
    ],
    id: "AroundSickChildren",
    title: "aroundSickChildren",
    type: SurveyQuestionType.RadioGrid
};
exports.FutureStudiesConfig = {
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true },
    ],
    id: "FutureStudies",
    title: "futureStudies",
    required: true,
    type: SurveyQuestionType.RadioGrid
};
exports.BlueLineConfig = {
    id: "BlueLine",
    title: "blueLine",
    buttons: [
        { key: "yes", primary: false, enabled: true },
        { key: "no", primary: false, enabled: true },
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
        },
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
        },
    ],
    required: true,
    type: SurveyQuestionType.RadioGrid
};
exports.SURVEY_QUESTIONS = [
    exports.WhatSymptomsConfig,
    exports.SymptomsSeverityConfig,
    exports.FeverSeverityConfig,
    exports.HeadacheSeverityConfig,
    exports.CoughSeverityConfig,
    exports.ChillsSeverityConfig,
    exports.SweatsSeverityConfig,
    exports.SoreThroatSeverityConfig,
    exports.VomitingSeverityConfig,
    exports.RunningNoseSeverityConfig,
    exports.SneezingSeverityConfig,
    exports.FatigueSeverityConfig,
    exports.AchesSeverityConfig,
    exports.TroubleBreathingSeverityConfig,
    exports.WhenFirstNoticedIllnessConfig,
    exports.HowLongToSickestConfig,
    exports.FluOrColdConfig,
    exports.WorseOrDifferentFromTypicalConfig,
    exports.AntiviralConfig,
    exports.WhenFirstStartedAntiviralConfig,
    exports.FluShotConfig,
    exports.FluShotDateConfig,
    exports.HowReceivedFluShotConfig,
    exports.AffectedRegularActivitiesConfig,
    exports.SmokeTobaccoConfig,
    exports.HouseholdTobaccoConfig,
    exports.TravelOutsideStateConfig,
    exports.TravelOutsideUSConfig,
    exports.SpentTimeCityConfig,
    exports.SpentTimeStateConfig,
    exports.SpentTimeZipCodeConfig,
    exports.WhichCountriesOutsideUSConfig,
    exports.PeopleInHouseholdConfig,
    exports.ChildrenAgeGroupsConfig,
    exports.ChildrenDaycarePreschoolConfig,
    exports.SomeoneDiagnosedConfig,
    exports.InContactConfig,
    exports.PublicTransportationConfig,
    exports.AroundSickChildrenConfig,
    exports.FutureStudiesConfig,
    exports.BlueLineConfig,
    exports.PinkWhenBlueConfig,
];
