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
      onClick: "ResearchStudy",
    },
    key: "HowAmIHelping",
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
        name: strings.common.emailEntry.placeholder,
        placeholder: strings.common.emailEntry.placeholder,
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
      onClick: "SymptomsInfo",
    },
    key: "WhatSymptoms",
    input: [
      {
        name: strings.surveyTitle.whatSymptoms,
        type: "checkbox",
        dbLocation: "responses",
        options: [
          strings.surveyOption.feelingFeverish,
          strings.surveyOption.headache,
          strings.surveyOption.cough,
          strings.surveyOption.chillsOrShivering,
          strings.surveyOption.sweats,
          strings.surveyOption.soreThroat,
          strings.surveyOption.vomiting,
          strings.surveyOption.runningNose,
          strings.surveyOption.sneezing,
          strings.surveyOption.fatigue,
          strings.surveyOption.muscleOrBodyAches,
          strings.surveyOption.troubleBreathing,
          strings.surveyOption.noneOfTheAbove,
        ],
      },
    ],
  },
  {
    type: "input",
    title: strings.WhatSymptoms.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "IllnessBeginnings",
    },
    key: "SymptomsInfo",
    input: [
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
    title: strings.IllnessBeginnings.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "AntiviralMedication",
    },
    key: "IllnessBeginnings",
    input: [
      {
        name: strings.surveyTitle.whenFirstNoticedIllness,
        type: "date",
        dbLocation: "responses",
        placeholder: strings.datePicker.selectDate,
      },
      {
        name: strings.surveyTitle.howLongToSickest,
        type: "radio",
        dbLocation: "responses",
        options: [
          strings.surveyButton.halfDay,
          strings.surveyButton["half-1Day"],
          strings.surveyButton["1-1HalfDays"],
          strings.surveyButton["1Half-2Days"],
          strings.surveyButton["3Days"],
          strings.surveyButton["4Days"],
          strings.surveyButton["5+Days"],
        ],
      },
      {
        name: strings.surveyTitle.fluOrCold,
        type: "radio",
        dbLocation: "responses",
        options: [
          strings.surveyButton.flu,
          strings.surveyButton.commonCold,
          strings.surveyButton.anotherIllness,
        ],
      },
      {
        name: strings.surveyTitle.worseOrDifferentFromTypical,
        type: "radio",
        dbLocation: "responses",
        options: [strings.surveyButton.yes, strings.surveyButton.no],
      },
    ],
  },
  {
    type: "input",
    title: strings.AntiviralMedication.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "InfluenzaVaccination",
    },
    key: "AntiviralMedication",
    input: [
      {
        name: strings.surveyTitle.antiviral,
        type: "radio",
        dbLocation: "responses",
        options: [
          strings.surveyButton.no,
          strings.surveyButton.oseltamivir,
          strings.surveyButton.zanamivir,
          strings.surveyButton.peramivir,
          strings.surveyButton.baloxavir,
          strings.surveyButton.yesButDontKnowWhich,
          strings.surveyButton.dontKnow,
        ],
      },
      {
        name: strings.surveyTitle.whenFirstStartedAntiviral,
        type: "date",
        dbLocation: "responses",
        placeholder: strings.datePicker.selectDate,
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
        type: "radio",
        dbLocation: "responses",
        options: [
          strings.surveyButton.yes,
          strings.surveyButton.no,
          strings.surveyButton.dontKnow,
        ],
      },
      {
        name: strings.surveyTitle.fluShotDate,
        type: "date",
        dbLocation: "responses",
        placeholder: strings.datePicker.selectDate,
      },
      {
        name: strings.surveyTitle.howReceivedFluShot,
        type: "radio",
        dbLocation: "responses",
        options: [
          strings.surveyButton.injection,
          strings.surveyButton.nasalSpray,
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
      onClick: "GeneralExposure",
    },
    key: "GeneralHealth",
    input: [
      {
        name: strings.surveyTitle.affectedRegularActivities,
        type: "radio",
        dbLocation: "responses",
        options: [
          strings.surveyButton.notAtAll,
          strings.surveyButton.aLittleBit,
          strings.surveyButton.somewhat,
          strings.surveyButton.quiteABit,
          strings.surveyButton.veryMuch,
        ],
      },
      {
        name: strings.surveyTitle.smokeTobacco,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [strings.surveyButton.yes, strings.surveyButton.no],
      },
      {
        name: strings.surveyTitle.householdTobacco,
        type: "buttonGrid",
        dbLocation: "responses",
        options: [strings.surveyButton.yes, strings.surveyButton.no],
      },
    ],
  },
  {
    type: "input",
    title: strings.GeneralExposure.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "ThankYouSurvey",
    },
    key: "GeneralExposure",
    input: [
      {
        name: strings.surveyTitle.travelOutsideState.replace("{{state}}", "WA"),
        type: "radio",
        dbLocation: "responses",
        options: [strings.surveyButton.yes, strings.surveyButton.no],
      },
      {
        name: strings.surveyTitle.travelOutsideUS,
        type: "radio",
        dbLocation: "responses",
        options: [strings.surveyButton.yes, strings.surveyButton.no],
      },
      {
        name: strings.surveyTitle.whichCountriesOutsideUS,
        type: "select",
        link: strings.surveyOption.selectCountries,
      },
      {
        name: strings.surveyTitle.spentTimeCity,
        placeholder1: strings.surveyPlaceholder.enterCity,
        link: strings.surveyButton.selectState,
        placeholder2: strings.surveyPlaceholder.enterZip,
        type: "location",
        dbLocation: "responses",
      },
      {
        name: strings.surveyTitle.peopleInHousehold,
        type: "radio",
        dbLocation: "responses",
        options: [
          strings.surveyButton.liveByMyself,
          strings.surveyButton.two,
          strings.surveyButton.three,
          strings.surveyButton.four,
          strings.surveyButton.five,
          strings.surveyButton.sixOrMore,
        ],
      },
      {
        name: strings.surveyTitle.childrenAgeGroups,
        type: "checkbox",
        dbLocation: "responses",
        options: [
          strings.surveyOption.noChildren,
          strings.surveyOption.zeroToFive,
          strings.surveyOption.sixToTwelve,
          strings.surveyOption.olderThanTwelve,
        ],
      },
      {
        name: strings.surveyTitle.childrenDaycarePreschool,
        type: "radio",
        dbLocation: "responses",
        options: [strings.surveyButton.yes, strings.surveyButton.no],
      },
      {
        name: strings.surveyTitle.someoneDiagnosed,
        type: "radio",
        dbLocation: "responses",
        options: [
          strings.surveyButton.yes,
          strings.surveyButton.no,
          strings.surveyButton.dontKnow,
        ],
      },
      {
        name: strings.surveyTitle.inContact,
        type: "radio",
        dbLocation: "responses",
        options: [
          strings.surveyButton.yes,
          strings.surveyButton.no,
          strings.surveyButton.dontKnow,
        ],
      },
      {
        name: strings.surveyTitle.publicTransportation,
        type: "radio",
        dbLocation: "responses",
        options: [strings.surveyButton.yes, strings.surveyButton.no],
      },
      {
        name: strings.surveyTitle.aroundSickChildren,
        type: "radio",
        dbLocation: "responses",
        options: [strings.surveyButton.yes, strings.surveyButton.no],
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
      onClick: "OpenSwabUTM",
    },
    key: "PrepareUTM",
  },
  {
    type: "basic",
    title: strings.OpenSwabUTM.title,
    button: {
      name: strings.common.button.continue + " ",
      onClick: "MucusUTM",
    },
    key: "OpenSwabUTM",
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
      name: strings.common.button.continue + " ",
      onClick: "Thanks",
    },
    key: "Shipping",
  },
  {
    type: "basic",
    title: strings.Thanks.title,
    key: "Thanks",
  },
];
