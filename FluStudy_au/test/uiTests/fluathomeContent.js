import strings from "../../src/i18n/locales/en.json";

export const content = [
  {
    type: "basic",
    title: strings.Welcome.title,
    button: strings.common.button.next.toUpperCase(),
    dbScreenName: "Welcome",
  },
  {
    type: "basic",
    title: strings.WhatsRequired.title,
    button: strings.common.button.next.toUpperCase(),
    dbScreenName: "WhatsRequired",
  },
  {
    type: "basic",
    title: strings.ReadyToBegin.title,
    button: strings.common.button.next.toUpperCase(),
    dbScreenName: "ReadyToBegin",
  },
  {
    type: "basic",
    title: strings.Consent.title,
    button: strings.Consent.accept.toUpperCase(),
    dbScreenName: "Consent",
  },
  {
    type: "basic",
    title: strings.ScanInstructions.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "ScanInstructions",
  },
  {
    type: "camera",
    popup: strings.BarcodeScanner.cameraWarning,
    button: strings.BarcodeScanner.enterManually,
    dbScreenName: "Scan",
  },
  {
    type: "input",
    title: strings.ManualEntry.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "ManualEntry",
    input: [
      {
        name: strings.barcode.placeholder,
        type: "text",
      },
      {
        name: strings.barcode.secondPlaceholder,
        type: "text",
      },
    ],
  },
  {
    type: "basic",
    title: strings.ManualConfirmation.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "ManualConfirmation",
  },
  {
    type: "basic",
    title: strings.Unpacking.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "Unpacking",
  },
  {
    type: "basic",
    title: strings.Swab.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "Swab",
  },
  {
    type: "basic",
    title: strings.OpenSwab.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "OpenSwab",
  },
  {
    type: "basic",
    title: strings.Mucus.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "Mucus",
  },
  {
    type: "basic",
    title: strings.SwabInTube.title,
    button: strings.SwabInTube.startTimer.toUpperCase(),
    dbScreenName: "SwabInTube",
  },
  {
    type: "timer",
    title: strings.FirstTimer.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "FirstTimer",
  },
  {
    type: "basic",
    title: strings.RemoveSwabFromTube.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "RemoveSwabFromTube",
  },
  {
    type: "basic",
    title: strings.OpenTestStrip.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "OpenTestStrip",
  },
  {
    type: "basic",
    title: strings.StripInTube.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "StripInTube",
  },
  {
    type: "input",
    title: strings.WhatSymptoms.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "WhatSymptoms",
    input: [
      {
        name: strings.surveyTitle.whatSymptoms,
        type: "checkbox",
        options: [
          strings.surveyOption.feelingFeverish,
          strings.surveyOption.chillsOrSweats,
          strings.surveyOption.cough,
          strings.surveyOption.soreThroat,
          strings.surveyOption.headache,
          strings.surveyOption.fatigue,
          strings.surveyOption.muscleOrBodyAches,
          strings.surveyOption.runningNose,
          strings.surveyOption.shortnessOfBreath,
        ],
      },
    ],
  },
  {
    type: "input",
    title: strings.WhatSymptoms.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "WhenSymptoms",
    input: [
      {
        name: strings.surveyTitle.symptomsStart,
        type: "buttonGrid",
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
        options: [strings.surveyButton.no, strings.surveyButton.yes],
      },
      {
        name: strings.surveyTitle.symptomsSeverity,
        type: "buttonGrid",
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
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "GeneralExposure",
    input: [
      {
        name: strings.surveyTitle.inContact,
        type: "buttonGrid",
        options: [
          strings.surveyButton.no,
          strings.surveyButton.yes,
          strings.surveyButton.dontKnow,
        ],
      },
      {
        name: strings.surveyTitle.coughSneeze,
        type: "buttonGrid",
        options: [
          strings.surveyButton.no,
          strings.surveyButton.yes,
          strings.surveyButton.dontKnow,
        ],
      },
      {
        name: strings.surveyTitle.youngChildren,
        type: "radio",
        options: [
          strings.surveyButton.noContactUnderFive,
          strings.surveyButton.oneChild,
          strings.surveyButton.twoToFiveChildren,
          strings.surveyButton.moreThanFiveChildren,
          strings.surveyButton.doNotKnow,
        ],
      },
      {
        name: strings.surveyTitle.householdChildren,
        type: "buttonGrid",
        options: [strings.surveyButton.no, strings.surveyButton.yes],
      },
      {
        name: strings.surveyTitle.childrenWithChildren,
        type: "buttonGrid",
        options: [
          strings.surveyButton.no,
          strings.surveyButton.yes,
          strings.surveyButton.dontKnow,
        ],
      },
      {
        name: strings.surveyTitle.peopleInHousehold,
        type: "buttonGrid",
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
        options: [
          strings.surveyButton["0-1"],
          strings.surveyButton["2"],
          strings.surveyButton["3"],
          strings.surveyButton["4"],
          strings.surveyButton["5plus"],
        ],
      },
    ],
  },
  {
    type: "input",
    title: strings.GeneralHealth.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "GeneralHealth",
    input: [
      {
        name: strings.surveyTitle.medicalCondition,
        type: "checkbox",
        options: [
          strings.surveyOption.asthma,
          strings.surveyOption.copd,
          strings.surveyOption.diabetes,
          strings.surveyOption.noneOfThese,
          strings.surveyOption.doNotKnow,
        ],
      },
      {
        name: strings.surveyTitle.fluShot,
        type: "buttonGrid",
        options: [
          strings.surveyButton.no,
          strings.surveyButton.yes,
          strings.surveyButton.dontKnow,
        ],
      },
      {
        name: strings.surveyTitle.smokeTobacco,
        type: "buttonGrid",
        options: [strings.surveyButton.no, strings.surveyButton.yes],
      },
      {
        name: strings.surveyTitle.householdTobacco,
        type: "buttonGrid",
        options: [strings.surveyButton.no, strings.surveyButton.yes],
      },
      {
        name: strings.surveyTitle.interfering,
        type: "buttonGrid",
        options: [strings.surveyButton.no, strings.surveyButton.yes],
      },
      {
        name: strings.surveyTitle.antibiotics,
        type: "buttonGrid",
        options: [
          strings.surveyButton.no,
          strings.surveyButton.yes,
          strings.surveyButton.dontKnow,
        ],
      },
      {
        name: strings.surveyTitle.assignedSex,
        type: "buttonGrid",
        options: [
          strings.surveyButton.male,
          strings.surveyButton.female,
          strings.surveyButton.other,
        ],
      },
      {
        name: strings.surveyTitle.race,
        type: "checkbox",
        options: [
          strings.surveyOption.americanIndianOrAlaskaNative,
          strings.surveyOption.asian,
          strings.surveyOption.nativeHawaiian,
          strings.surveyOption.blackOrAfricanAmerican,
          strings.surveyOption.white,
          strings.surveyOption.other,
        ],
      },
      {
        name: strings.surveyTitle.hispanic,
        type: "buttonGrid",
        options: [strings.surveyButton.no, strings.surveyButton.yes],
      },
      {
        name: strings.surveyTitle.healthInsurance,
        type: "checkbox",
        options: [
          strings.surveyOption.noInsurance,
          strings.surveyOption.privateInsuranceEmployer,
          strings.surveyOption.privateInsuranceSelf,
          strings.surveyOption.governmentInsurance,
          strings.surveyOption.other,
          strings.surveyOption.doNotKnow,
        ],
      },
    ],
  },
  {
    type: "timer",
    title: strings.ThankYouSurvey.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "ThankYouSurvey",
  },
  {
    type: "basic",
    title: strings.TestStripReady.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "TestStripReady",
  },
  {
    type: "basic",
    title: strings.RDTInstructions.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "RDTInstructions",
  },
  {
    type: "rdt",
    title: strings.TestStripCamera.title,
    dbScreenName: "RDTReader",
  },
  {
    type: "basic",
    title: strings.TestStripConfirmation.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "TestStripConfirmation",
  },
  {
    type: "input",
    title: strings.TestStripSurvey.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "TestStripSurvey",
    input: [
      {
        name: strings.surveyTitle.blueLine,
        type: "buttonGrid",
        options: [strings.surveyButton.no, strings.surveyButton.yes],
      },
      {
        name: strings.surveyTitle.pinkLine,
        type: "radio",
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
    title: strings.TestResult.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "TestResult",
  },
  {
    type: "basic",
    title: strings.Advice.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "Advice",
  },
  {
    type: "basic",
    title: strings.CleanTest.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "CleanTest",
  },
  {
    type: "input",
    title: strings.TestFeedback.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "TestFeedback",
    input: [
      {
        name: strings.surveyTitle.TestFeedback,
        type: "radio",
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
    title: strings.Thanks.title,
    dbScreenName: "Thanks",
  },
];
