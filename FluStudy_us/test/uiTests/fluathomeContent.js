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
      name: strings.common.button.continue + " ",
      onClick: "HowDoesTestWork",
    },
    key: "Welcome",
  },
  {
    type: "basic",
    title: strings.HowDoesTestWork.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "HowAmIHelping",
    },
    key: "HowDoesTestWork",
  },
  {
    type: "basic",
    title: strings.HowAmIHelping.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "WhatExpectToLearn",
    },
    key: "HowAmIHelping",
  },
  {
    type: "basic",
    title: strings.WhatExpectToLearn.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "ResearchStudy",
    },
    key: "WhatExpectToLearn",
  },
  {
    type: "basic",
    title: strings.ResearchStudy.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "ScanInstructions",
    },
    key: "ResearchStudy",
  },
  {
    type: "basic",
    title: strings.ScanInstructions.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "ManualEntry",
    },
    key: "ScanInstructions",
  },
  {
    type: "barcode",
    title: strings.ManualEntry.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "EmailConfirmation",
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
    type: "input",
    title: strings.EmailConfirmation.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "Unpacking",
    },
    key: "EmailConfirmation",
    input: [
      {
        name: strings.EmailConfirmation.placeholder,
        placeholder: strings.EmailConfirmation.placeholder,
        type: "text",
      },
    ],
  },
  {
    type: "basic",
    title: strings.Unpacking.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "Swab",
    },
    key: "Unpacking",
  },
  {
    type: "basic",
    title: strings.Swab.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "OpenSwab",
    },
    key: "Swab",
  },
  {
    type: "basic",
    title: strings.OpenSwab.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "Mucus",
    },
    key: "OpenSwab",
  },
  {
    type: "basic",
    title: strings.Mucus.title,
    button: {
      name: strings.common.button.continue + " ",
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
      name: strings.common.button.continue + " ",
      onClick: "RemoveSwabFromTube",
    },
    key: "FirstTimer",
  },
  {
    type: "basic",
    title: strings.RemoveSwabFromTube.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "OpenTestStrip",
    },
    key: "RemoveSwabFromTube",
  },
  {
    type: "basic",
    title: strings.OpenTestStrip.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "StripInTube",
    },
    key: "OpenTestStrip",
  },
  {
    type: "basic",
    title: strings.StripInTube.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "WhatSymptoms",
    },
    key: "StripInTube",
  },
  {
    type: "input",
    title: strings.WhatSymptoms.title,
    button: {
      name: strings.common.button.continue + " ",
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
      name: strings.common.button.continue + " ",
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
      name: strings.common.button.continue + " ",
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
      name: strings.common.button.continue + " ",
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
      name: strings.common.button.continue + " ",
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
        name: strings.surveyTitle.antiviral,
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
          strings.surveyOption.americanIndianOrAlaskanNative,
          strings.surveyOption.asian,
          strings.surveyOption.blackOrAfricanAmerican,
          strings.surveyOption.nativeHawaiian,
          strings.surveyOption.white,
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
      name: strings.common.button.continue + " ",
      onClick: "TestStripReady",
    },
    key: "ThankYouSurvey",
  },
  {
    type: "basic",
    title: strings.TestStripReady.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "TestStripSurvey",
    },
    key: "TestStripReady",
  },
  {
    type: "blue_line_question",
    title: strings.TestStripSurvey.title,
    button: {
      name: strings.common.button.continue + " ",
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
    type: "input",
    title: strings.TestStripSurvey2.title,
    button: {
      name: strings.common.button.continue + " ",
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
      name: strings.common.button.continue + " ",
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
      name: strings.common.button.continue + " ",
      onClick: "PackUpTest",
    },
    key: "TestStripConfirmation",
  },
  {
    type: "basic",
    title: strings.PackUpTest.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "PrepareUTM",
    },
    key: "PackUpTest",
  },
  {
    type: "basic",
    title: strings.PrepareUTM.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "MucusUTM",
    },
    key: "PrepareUTM",
  },
  {
    type: "basic",
    title: strings.MucusUTM.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "SwabInTubeUTM",
    },
    key: "MucusUTM",
  },
  {
    type: "basic",
    title: strings.SwabInTubeUTM.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "PackUpUTM",
    },
    key: "SwabInTubeUTM",
  },
  {
    type: "basic",
    title: strings.PackUpUTM.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "PackUpBox",
    },
    key: "PackUpUTM",
  },
  {
    type: "basic",
    title: strings.PackUpBox.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "Shipping",
    },
    key: "PackUpBox",
  },
  {
    type: "basic",
    title: strings.Shipping.title,
    button: {
      name: strings.Shipping.dropoff.toUpperCase(),
      onClick: "TestResult",
    },
    key: "Shipping",
  },
  {
    type: "basic",
    title: strings.TestResult.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "SelfCare",
    },
    key: "TestResult",
  },
  {
    type: "basic",
    title: strings.SelfCare.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "Thanks",
    },
    key: "SelfCare",
  },
  {
    type: "basic",
    title: strings.Thanks.title,
    key: "Thanks",
  },
];
