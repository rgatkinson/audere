// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import strings from "../../../src/i18n/locales/en.json";

export const inputs = {
  [strings.barcode.placeholder]: "ID19111303",
  [strings.common.emailEntry.placeholder]: "fake3@auderenow.org",
  [strings.surveyTitle.whatSymptoms]: [
    strings.surveyOption.cough,
    strings.surveyOption.runningNose,
  ],
  [strings.surveyTitle.symptomsSeverity]: [
    strings.surveyButton.severe,
    strings.surveyButton.severe,
  ],
  [strings.surveyTitle.whenFirstNoticedIllness]: "none",
  [strings.surveyTitle.howLongToSickest]: strings.surveyButton["1Half-2Days"],
  [strings.surveyTitle.fluOrCold]: strings.surveyButton.anotherIllness,
  [strings.surveyTitle.worseOrDifferentFromTypical]: strings.surveyButton.yes,
  [strings.surveyTitle.antiviral]: strings.surveyButton.peramivir,
  [strings.surveyTitle.whenFirstStartedAntiviral]: "none",
  [strings.surveyTitle.fluShot]: strings.surveyButton.yes,
  [strings.surveyTitle.fluShotDate]: "none",
  [strings.surveyTitle.howReceivedFluShot]: strings.surveyButton.nasalSpray,
  [strings.surveyTitle.affectedRegularActivities]:
    strings.surveyButton.somewhat,
  [strings.surveyTitle.smokeTobacco]: strings.surveyButton.yes,
  [strings.surveyTitle.householdTobacco]: strings.surveyButton.no,
  [strings.surveyTitle.travelOutsideState.replace("{{state}}", "MD")]: strings
    .surveyButton.yes,
  [strings.surveyTitle.travelOutsideUS]: strings.surveyButton.no,
  [strings.surveyTitle.spentTimeCity]: {
    city: "Silver Spring",
    state: "Maryland",
    zip: "20910",
  },
  [strings.surveyTitle.peopleInHousehold]: strings.surveyButton.three,
  [strings.surveyTitle.childrenAgeGroups]: [strings.surveyOption.zeroToFive],
  [strings.surveyTitle.childrenDaycarePreschool]: strings.surveyButton.yes,
  [strings.surveyTitle.someoneDiagnosed]: strings.surveyButton.no,
  [strings.surveyTitle.inContact]: strings.surveyButton.dontKnow,
  [strings.surveyTitle.publicTransportation]: strings.surveyButton.yes,
  [strings.surveyTitle.aroundSickChildren]: strings.surveyButton.no,
  [strings.surveyTitle.futureStudies]: strings.surveyButton.yes,
  [strings.surveyTitle.blueLine]: strings.surveyButton.yes,
  [strings.surveyTitle.pinkLine]: strings.surveyButton.yesBelowBlue,
  state: "MD",
};
