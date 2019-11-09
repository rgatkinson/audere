// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import strings from "../../../src/i18n/locales/en.json";
const today = new Date();

export const inputs = {
  [strings.barcode.placeholder]: "0050050050",
  [strings.common.emailEntry.placeholder]: "philip@auderenow.org",
  [strings.surveyTitle.whatSymptoms]: [
    strings.surveyOption.sweats,
    strings.surveyOption.fatigue,
  ],
  [strings.surveyTitle.symptomsSeverity]: [
    strings.surveyButton.moderate,
    strings.surveyButton.severe,
  ],
  [strings.surveyTitle.whenFirstNoticedIllness]: "none",
  [strings.surveyTitle.howLongToSickest]: strings.surveyButton["4Days"],
  [strings.surveyTitle.fluOrCold]: strings.surveyButton.commonCold,
  [strings.surveyTitle.worseOrDifferentFromTypical]: strings.surveyButton.yes,
  [strings.surveyTitle.antiviral]: strings.surveyButton.yesButDontKnowWhich,
  [strings.surveyTitle.whenFirstStartedAntiviral]: "none",
  [strings.surveyTitle.fluShot]: strings.surveyButton.no,
  [strings.surveyTitle.affectedRegularActivities]:
    strings.surveyButton.veryMuch,
  [strings.surveyTitle.smokeTobacco]: strings.surveyButton.yes,
  [strings.surveyTitle.householdTobacco]: strings.surveyButton.yes,
  [strings.surveyTitle.travelOutsideState.replace("{{state}}", "WA")]: strings
    .surveyButton.yes,
  [strings.surveyTitle.travelOutsideUS]: strings.surveyButton.yes,
  [strings.surveyTitle.peopleInHousehold]: strings.surveyButton.five,
  [strings.surveyTitle.childrenAgeGroups]: [
    strings.surveyOption.olderThanTwelve,
  ],
  [strings.surveyTitle.someoneDiagnosed]: strings.surveyButton.yes,
  [strings.surveyTitle.inContact]: strings.surveyButton.no,
  [strings.surveyTitle.publicTransportation]: strings.surveyButton.no,
  [strings.surveyTitle.aroundSickChildren]: strings.surveyButton.no,
  [strings.surveyTitle.blueLine]: strings.surveyButton.yes,
  [strings.surveyTitle.pinkLine]: strings.surveyButton.noPink,
};
