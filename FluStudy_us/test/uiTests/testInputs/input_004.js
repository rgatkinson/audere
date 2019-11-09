// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import strings from "../../../src/i18n/locales/en.json";

export const inputs = {
  [strings.barcode.placeholder]: "0040040040",
  [strings.common.emailEntry.placeholder]: "philip@auderenow.org",
  [strings.surveyTitle.whatSymptoms]: [
    strings.surveyOption.chillsOrShivering,
    strings.surveyOption.sneezing,
  ],
  [strings.surveyTitle.symptomsSeverity]: [
    strings.surveyButton.mild,
    strings.surveyButton.moderate,
  ],
  [strings.surveyTitle.whenFirstNoticedIllness]: "none",
  [strings.surveyTitle.howLongToSickest]: strings.surveyButton["3Days"],
  [strings.surveyTitle.fluOrCold]: strings.surveyButton.flu,
  [strings.surveyTitle.worseOrDifferentFromTypical]: strings.surveyButton.no,
  [strings.surveyTitle.antiviral]: strings.surveyButton.baloxavir,
  [strings.surveyTitle.whenFirstStartedAntiviral]: "none",
  [strings.surveyTitle.fluShot]: strings.surveyButton.yes,
  [strings.surveyTitle.fluShotDate]: "none",
  [strings.surveyTitle.howReceivedFluShot]: strings.surveyButton.dontKnow,
  [strings.surveyTitle.affectedRegularActivities]:
    strings.surveyButton.quiteABit,
  [strings.surveyTitle.smokeTobacco]: strings.surveyButton.no,
  [strings.surveyTitle.householdTobacco]: strings.surveyButton.yes,
  // [strings.surveyTitle.travelOutsideState.replace("{{state}}", "WA")]: strings
  //   .surveyButton.no,
  // [strings.surveyTitle.spentTimeCity]: {
  //   city: "Charleston",
  //   state: "WV",
  //   zip: "25301",
  // },
  [strings.surveyTitle.peopleInHousehold]: strings.surveyButton.four,
  [strings.surveyTitle.childrenAgeGroups]: [strings.surveyOption.sixToTwelve],
  [strings.surveyTitle.someoneDiagnosed]: strings.surveyButton.dontKnow,
  [strings.surveyTitle.inContact]: strings.surveyButton.yes,
  [strings.surveyTitle.publicTransportation]: strings.surveyButton.no,
  [strings.surveyTitle.aroundSickChildren]: strings.surveyButton.yes,
  [strings.surveyTitle.blueLine]: strings.surveyButton.yes,
  [strings.surveyTitle.pinkLine]: strings.surveyButton.yesAboveBelowBlue,
};
