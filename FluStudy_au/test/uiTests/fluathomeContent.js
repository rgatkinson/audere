// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import strings from "../../src/i18n/locales/en.json";

export const content = [
  {
    type: "basic",
    title: strings.Welcome.title,
    button: {
      name: strings.common.button.next.toUpperCase(),
      onClick: "WhatsRequired",
    },
    key: "Welcome",
  },
  {
    type: "basic",
    title: strings.WhatsRequired.title,
    button: {
      name: strings.common.button.next.toUpperCase(),
      onClick: "ReadyToBegin",
    },
    key: "WhatsRequired",
  },
  {
    type: "basic",
    title: strings.ReadyToBegin.title,
    button: {
      name: strings.common.button.next.toUpperCase(),
      onClick: "ResearchStudy",
    },
    key: "ReadyToBegin",
  },
  {
    type: "basic",
    title: strings.ResearchStudy.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "ParticipantInformation",
    },
    key: "ResearchStudy",
  },
  {
    type: "basic",
    title: strings.ParticipantInformation.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "Consent",
    },
    key: "ParticipantInformation",
  },
  {
    type: "consent",
    title: strings.Consent.title,
    button: {
      name: strings.Consent.accept.toUpperCase(),
      onClick: "ManualEntry",
    },
    denyButton: {
      name: strings.Consent.noThanks.toUpperCase(),
      onClick: "ConsentDeclined",
    },
    key: "Consent",
    input: [
      {
        name: strings.surveyTitle.researchBySameResearchers,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [strings.surveyButton.no, strings.surveyButton.yes],
      },
    ],
  },
  {
    type: "basic",
    title: strings.ConsentDeclined.title,
    button: {
      name: strings.ConsentDeclined.backToConsent.toUpperCase(),
      onClick: "Consent",
    },
    key: "ConsentDeclined",
  },
  {
    type: "barcode",
    title: strings.ManualEntry.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "ManualConfirmation",
    },
    key: "ManualEntry",
    input: [
      {
        name: strings.barcode.placeholder,
        placeholder: strings.barcode.placeholder,
        type: "text",
        dbLocation: "samples",
      },
      {
        name: strings.barcode.secondPlaceholder,
        placeholder: strings.barcode.secondPlaceholder,
        type: "text",
      },
    ],
  },
  {
    type: "basic",
    title: strings.BarcodeContactSupport.title,
    button: {
      name: strings.links.inputManually,
      onClick: "ManualEntry",
    },
    key: "BarcodeContactSupport",
  },
  {
    type: "basic",
    title: strings.ManualConfirmation.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "Unpacking",
    },
    key: "ManualConfirmation",
  },
  {
    type: "basic",
    title: strings.Unpacking.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "Swab",
    },
    key: "Unpacking",
  },
  {
    type: "basic",
    title: strings.Swab.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "OpenSwab",
    },
    key: "Swab",
  },
  {
    type: "basic",
    title: strings.OpenSwab.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "Mucus",
    },
    key: "OpenSwab",
  },
  {
    type: "basic",
    title: strings.Mucus.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "SwabInTube",
    },
    key: "Mucus",
  },
  {
    type: "basic",
    title: strings.SwabInTube.title,
    button: {
      name: strings.SwabInTube.startTimer.toUpperCase(),
      onClick: "FirstTimer",
    },
    key: "SwabInTube",
  },
  {
    type: "timer",
    title: strings.FirstTimer.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "RemoveSwabFromTube",
    },
    key: "FirstTimer",
  },
  {
    type: "basic",
    title: strings.RemoveSwabFromTube.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "OpenTestStrip",
    },
    key: "RemoveSwabFromTube",
  },
  {
    type: "basic",
    title: strings.OpenTestStrip.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "StripInTube",
    },
    key: "OpenTestStrip",
  },
  {
    type: "basic",
    title: strings.StripInTube.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "WhatSymptoms",
    },
    key: "StripInTube",
  },
  {
    type: "input",
    title: strings.WhatSymptoms.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "WhenSymptoms",
    },
    key: "WhatSymptoms",
    input: [
      {
        name: strings.surveyTitle.whatSymptoms,
        type: "checkbox",
        dbLocation: "responses",
        options: [
          strings.surveyOption.feelingFeverish,
          strings.surveyOption.cough,
          strings.surveyOption.fatigue,
          strings.surveyOption.chillsOrSweats,
          strings.surveyOption.soreThroat,
          strings.surveyOption.headache,
          strings.surveyOption.muscleOrBodyAches,
          strings.surveyOption.runningNose,
          strings.surveyOption.shortnessOfBreath,
          strings.surveyOption.vomiting,
        ],
      },
    ],
  },
  {
    type: "input",
    title: strings.WhatSymptoms.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "GeneralExposure",
    },
    key: "WhenSymptoms",
    input: [
      {
        name: strings.surveyTitle.symptomsStart,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [
          strings.surveyButton["1day"],
          strings.surveyButton["2days"],
          strings.surveyButton["3days"],
          strings.surveyButton["4days"],
        ],
      },
      {
        name: strings.surveyTitle.symptomsLast48,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [strings.surveyButton.no, strings.surveyButton.yes],
      },
      {
        name: strings.surveyTitle.symptomsSeverity,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [
          strings.surveyButton.mild,
          strings.surveyButton.moderate,
          strings.surveyButton.severe,
        ],
      },
    ],
  },
  {
    type: "input",
    title: strings.GeneralExposure.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "InfluenzaVaccination",
    },
    key: "GeneralExposure",
    input: [
      {
        name: strings.surveyTitle.inContact,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [
          strings.surveyButton.no,
          strings.surveyButton.yes,
          strings.surveyButton.dontKnow,
        ],
      },
      {
        name: strings.surveyTitle.coughSneeze,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [
          strings.surveyButton.no,
          strings.surveyButton.yes,
          strings.surveyButton.dontKnow,
        ],
      },
      {
        name: strings.surveyTitle.youngChildren,
        type: "radio",
        dbLocation: "responses",
        options: [
          strings.surveyButton.noContactUnderFive,
          strings.surveyButton.oneChild,
          strings.surveyButton.twoToFiveChildren,
          strings.surveyButton.moreThanFiveChildren,
          strings.surveyButton.dontKnow,
        ],
      },
      {
        name: strings.surveyTitle.householdChildren,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [strings.surveyButton.no, strings.surveyButton.yes],
      },
      {
        name: strings.surveyTitle.childrenWithChildren,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [
          strings.surveyButton.no,
          strings.surveyButton.yes,
          strings.surveyButton.dontKnow,
        ],
      },
      {
        name: strings.surveyTitle.peopleInHousehold,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [
          strings.surveyButton["1to2"],
          strings.surveyButton["3to4"],
          strings.surveyButton["5to7"],
          strings.surveyButton["8plus"],
        ],
      },
      {
        name: strings.surveyTitle.bedrooms,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [
          strings.surveyButton["0-1"],
          strings.surveyButton["2"],
          strings.surveyButton["3"],
          strings.surveyButton["4"],
          strings.surveyButton["5+"],
        ],
      },
    ],
  },
  {
    type: "input",
    title: strings.InfluenzaVaccination.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "GeneralHealth",
    },
    key: "InfluenzaVaccination",
    input: [
      {
        name: strings.surveyTitle.fluShot,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [
          strings.surveyButton.no,
          strings.surveyButton.yes,
          strings.surveyButton.dontKnow,
          strings.surveyButton.neverFlu,
        ],
      },
      {
        name: strings.surveyTitle.fluShotDate,
        type: "select",
        link: strings.monthPicker.selectDate,
        options: [],
      },
      {
        name: strings.surveyTitle.fluShotNationalImmunization,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [
          strings.surveyButton.no,
          strings.surveyButton.yes,
          strings.surveyButton.dontKnow,
        ],
      },
      {
        name: strings.surveyTitle.fluShotNationalImmunizationCondition,
        placeholder: "",
        type: "text",
        dbLocation: "responses",
      },
      {
        name: strings.surveyTitle.previousSeason,
        type: "radio",
        dbLocation: "responses",
        options: [
          strings.surveyButton.yes,
          strings.surveyButton.no,
          strings.surveyButton.dontKnow,
        ],
      },
    ],
  },
  {
    type: "input",
    title: strings.GeneralHealth.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "ThankYouSurvey",
    },
    key: "GeneralHealth",
    input: [
      {
        name: strings.surveyTitle.medicalCondition,
        type: "checkbox",
        dbLocation: "responses",
        options: [
          strings.surveyOption.asthma,
          strings.surveyOption.copd,
          strings.surveyOption.diabetes,
          strings.surveyOption.heartDisease,
          strings.surveyOption.noneOfThese,
          strings.surveyOption.dontKnow,
        ],
      },
      {
        name: strings.surveyTitle.healthcareWorker,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [
          strings.surveyButton.no,
          strings.surveyButton.yes,
          strings.surveyButton.dontKnow,
        ],
      },
      {
        name: strings.surveyTitle.smokeTobacco,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [strings.surveyButton.no, strings.surveyButton.yes],
      },
      {
        name: strings.surveyTitle.householdTobacco,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [strings.surveyButton.no, strings.surveyButton.yes],
      },
      {
        name: strings.surveyTitle.interfering,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [strings.surveyButton.no, strings.surveyButton.yes],
      },
      {
        name: strings.surveyTitle.antibiotics,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [
          strings.surveyButton.no,
          strings.surveyButton.yes,
          strings.surveyButton.dontKnow,
        ],
      },
      {
        name: strings.surveyTitle.assignedSex,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [
          strings.surveyButton.male,
          strings.surveyButton.female,
          strings.surveyButton.indeterminate,
          strings.surveyButton.preferNotToSay,
        ],
      },
      {
        name: strings.surveyTitle.race,
        type: "checkbox",
        dbLocation: "responses",
        options: [
          strings.surveyOption.aboriginal,
          strings.surveyOption.torresStraitIslander,
          strings.surveyOption.pacificIslander,
          strings.surveyOption.asian,
          strings.surveyOption.african,
          strings.surveyOption.european,
          strings.surveyOption.whiteAustralian,
          strings.surveyOption.southOrCentralAmerican,
          strings.surveyOption.middleEastNorthAfrican,
          strings.surveyOption.indianSubcontinent,
          strings.surveyOption.other,
        ],
      },
      {
        name: strings.surveyTitle.age,
        type: "select",
        link: strings.surveyButton.selectAge,
        dbLocation: "responses",
        options: [
          strings.surveyButton["18to19"],
          strings.surveyButton["20to24"],
          strings.surveyButton["25to29"],
          strings.surveyButton["30to34"],
          strings.surveyButton["35to39"],
          strings.surveyButton["40to44"],
          strings.surveyButton["45to49"],
          strings.surveyButton["50to54"],
          strings.surveyButton["55to59"],
          strings.surveyButton["60to64"],
          strings.surveyButton["65to69"],
          strings.surveyButton["70to74"],
          strings.surveyButton["75to79"],
          strings.surveyButton["80to84"],
          strings.surveyButton["85to89"],
          strings.surveyButton["90+"],
        ],
      },
    ],
  },
  {
    type: "timer",
    title: strings.ThankYouSurvey.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "TestStripReady",
    },
    key: "ThankYouSurvey",
  },
  {
    type: "basic",
    title: strings.TestStripReady.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "TestStripSurvey",
    },
    key: "TestStripReady",
  },
  {
    type: "blue_line_question",
    title: strings.TestStripSurvey.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "TestStripSurvey2",
    },
    key: "TestStripSurvey",
    input: [
      {
        name: strings.surveyTitle.blueLine,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [strings.surveyButton.no, strings.surveyButton.yes],
      },
    ],
  },
  {
    type: "basic",
    title: strings.InvalidResult.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "CleanTest",
    },
    key: "InvalidResult",
  },
  {
    type: "input",
    title: strings.TestStripSurvey.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "RDTInstructions",
    },
    key: "TestStripSurvey2",
    input: [
      {
        name: strings.surveyTitle.pinkLine,
        type: "radio",
        dbLocation: "responses",
        options: [
          strings.surveyButton.noPink,
          strings.surveyButton.yesAboveBlue,
          strings.surveyButton.yesBelowBlue,
          strings.surveyButton.yesAboveBelowBlue,
        ],
      },
    ],
  },
  {
    type: "basic",
    title: strings.RDTInstructions.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "RDTReader",
    },
    key: "RDTInstructions",
  },
  {
    type: "rdt",
    title: strings.TestStripCamera.title,
    key: "RDTReader",
  },
  {
    type: "basic",
    title: strings.TestStripConfirmation.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "PostRDTTestStripSurvey",
    },
    key: "TestStripConfirmation",
  },
  {
    type: "input",
    title: strings.PostRDTTestStripSurvey.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "TestResult",
    },
    key: "PostRDTTestStripSurvey",
    input: [
      {
        name: strings.surveyTitle.numLinesSeen,
        type: "radio",
        dbLocation: "responses",
        options: [
          strings.surveyButton.oneLine,
          strings.surveyButton.twoLines,
          strings.surveyButton.threeLines,
          strings.surveyButton.noneOfTheAbove,
        ],
      },
    ],
  },
  {
    type: "basic",
    title: strings.TestResult.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "CleanTest",
    },
    key: "TestResult",
  },
  {
    type: "basic",
    title: strings.CleanTest.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "TestFeedback",
    },
    key: "CleanTest",
  },
  {
    type: "input",
    title: strings.TestFeedback.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "FollowUpSurvey",
    },
    key: "TestFeedback",
    input: [
      {
        name: strings.surveyTitle.TestFeedback,
        type: "radio",
        dbLocation: "responses",
        options: [
          strings.surveyButton.easyCorrect,
          strings.surveyButton.confusingCorrect,
          strings.surveyButton.confusingNotCorrect,
          strings.surveyButton.incorrect,
        ],
      },
    ],
  },
  {
    type: "basic",
    title: strings.FollowUpSurvey.title,
    button: {
      name: strings.common.button.continue.toUpperCase(),
      onClick: "Thanks",
    },
    iosPopupOnContinue: "Allow",
    key: "FollowUpSurvey",
  },
  {
    type: "basic",
    title: strings.Thanks.title,
    key: "Thanks",
  },
];
