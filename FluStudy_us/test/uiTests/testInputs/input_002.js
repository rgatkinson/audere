// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import strings from "../../../src/i18n/locales/en.json";

export const inputs = {
  [strings.barcode.placeholder]: "ID11111111",
  [strings.common.emailEntry.placeholder]: "test@auderenow.org",
  [strings.surveyTitle.whatSymptoms]: [
    strings.surveyOption.headache,
    strings.surveyOption.vomiting,
    strings.surveyOption.troubleBreathing,
  ],
  [strings.surveyTitle.symptomsSeverity]: [
    strings.surveyButton.moderate,
    strings.surveyButton.moderate,
    strings.surveyButton.moderate,
  ],
  [strings.surveyTitle.whenFirstNoticedIllness]: "none",
  [strings.surveyTitle.howLongToSickest]: strings.surveyButton["1-1HalfDays"],
  [strings.surveyTitle.fluOrCold]: strings.surveyButton.commonCold,
  [strings.surveyTitle.worseOrDifferentFromTypical]: strings.surveyButton.no,
  [strings.surveyTitle.antiviral]: strings.surveyButton.zanamivir,
  [strings.surveyTitle.whenFirstStartedAntiviral]: "none",
  [strings.surveyTitle.fluShot]: strings.surveyButton.dontKnow,
  [strings.surveyTitle.affectedRegularActivities]:
    strings.surveyButton.aLittleBit,
  [strings.surveyTitle.smokeTobacco]: strings.surveyButton.no,
  [strings.surveyTitle.householdTobacco]: strings.surveyButton.no,
  [strings.surveyTitle.travelOutsideState.replace("{{state}}", "WA")]: strings
    .surveyButton.yes,
  [strings.surveyTitle.travelOutsideUS]: strings.surveyButton.yes,
  // [strings.surveyTitle.travelOutsideState.replace("{{state}}", "wa")]: strings
  //   .surveyButton.no,
  // [strings.surveyTitle.spentTimeCity]: {
  //   city: "Burlington",
  //   state: "VT",
  //   zip: "05401",
  // },
  [strings.surveyTitle.peopleInHousehold]: strings.surveyButton.two,
  [strings.surveyTitle.childrenAgeGroups]: [strings.surveyOption.noChildren],
  [strings.surveyTitle.someoneDiagnosed]: strings.surveyButton.yes,
  [strings.surveyTitle.inContact]: strings.surveyButton.no,
  [strings.surveyTitle.publicTransportation]: strings.surveyButton.no,
  [strings.surveyTitle.aroundSickChildren]: strings.surveyButton.no,
  [strings.surveyTitle.futureStudies]: strings.surveyButton.no,
  [strings.surveyTitle.blueLine]: strings.surveyButton.yes,
  [strings.surveyTitle.pinkLine]: strings.surveyButton.yesAboveBlue,
};
