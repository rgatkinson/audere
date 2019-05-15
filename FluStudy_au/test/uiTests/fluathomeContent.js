import strings from "../../src/i18n/locales/en.json";

export const content = [
  {
    type: "basic",
    title: strings.Welcome.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "Welcome",
  },
  {
    type: "basic",
    title: strings.PreConsent.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "Preconsent",
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
    popup: strings.Scan.cameraWarning,
    button: strings.Scan.enterManually,
    dbScreenName: "Scan",
  },
  {
    type: "input",
    title: strings.manualEntryScreen.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "ManualEntry",
    input: [
      {
        type: "text",
        placeholder: strings.barcode.placeholder,
        default: "aaaaaaaa",
      },
      {
        type: "text",
        placeholder: strings.barcode.secondPlaceholder,
        default: "aaaaaaaa",
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
    title: strings.firstTimerScreen.title,
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
        name: strings.surveyOption.feelingFeverish,
        type: "checkbox",
        default: "unchecked",
      },
      {
        name: strings.surveyOption.cough,
        type: "checkbox",
        default: "checked",
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
        type: "radio",
        options: [
          strings.surveyButton["1day"],
          strings.surveyButton["2days"],
          strings.surveyButton["3days"],
          strings.surveyButton["4days"],
        ],
        default: strings.surveyButton["1day"],
      },
      {
        name: strings.surveyTitle.symptomsLast48,
        type: "radio",
        options: [strings.surveyButton.no, strings.surveyButton.yes],
        default: strings.surveyButton.no,
      },
      {
        name: strings.surveyTitle.symptomsSeverity,
        type: "radio",
        options: [
          strings.surveyButton.mild,
          strings.surveyButton.moderate,
          strings.surveyButton.severe,
        ],
        default: strings.surveyButton.mild,
      },
    ],
  },
  {
    type: "basic",
    title: strings.surveyScreen.generalExposure,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "GeneralExposure",
  },
  {
    type: "input",
    title: strings.GeneralHealth.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "GeneralHealth",
    input: [
      {
        name: strings.surveyTitle.antibiotics,
        type: "radio",
        options: [
          strings.surveyButton.no,
          strings.surveyButton.yes,
          strings.surveyButton.dontKnow,
        ],
        default: strings.surveyButton.no,
      },
    ],
  },
  {
    type: "timer",
    title: strings.thankYouSurveyScreen.title,
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
    title: strings.RDTReader.title,
    dbScreenName: "RDTReader",
  },
  {
    type: "basic",
    title: strings.TestStripConfirmation.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "TestStripConfirmation",
  },
  {
    type: "basic",
    title: strings.testStripSurveyScreen.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "TestStripSurvey",
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
    type: "basic",
    title: strings.TestFeedback.title,
    button: strings.common.button.continue.toUpperCase(),
    dbScreenName: "TestFeedback",
  },
  {
    type: "basic",
    title: strings.Thanks.title,
    dbScreenName: "Thanks",
  },
];
