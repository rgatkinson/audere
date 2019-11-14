// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import strings from "../../../src/i18n/locales/en.json";
const today = new Date();

export const inputs = {
  [strings.barcode.placeholder]: "0010010010",
  [strings.common.emailEntry.placeholder]: "philip@auderenow.org",
  [strings.surveyTitle.whatSymptoms]: [
    strings.surveyOption.feelingFeverish,
    strings.surveyOption.soreThroat,
    strings.surveyOption.muscleOrBodyAches,
  ],
  [strings.surveyTitle.symptomsSeverity]: [
    strings.surveyButton.mild,
    strings.surveyButton.mild,
    strings.surveyButton.mild,
  ],
  [strings.surveyTitle.whenFirstNoticedIllness]: "none",
  [strings.surveyTitle.howLongToSickest]: strings.surveyButton["half-1Day"],
  [strings.surveyTitle.fluOrCold]: strings.surveyButton.flu,
  [strings.surveyTitle.worseOrDifferentFromTypical]: strings.surveyButton.yes,
  [strings.surveyTitle.antiviral]: strings.surveyButton.oseltamivir,
  [strings.surveyTitle.whenFirstStartedAntiviral]: "none",
  [strings.surveyTitle.fluShot]: strings.surveyButton.yes,
  [strings.surveyTitle.fluShotDate]: "none",
  [strings.surveyTitle.howReceivedFluShot]: strings.surveyButton.injection,
  [strings.surveyTitle.affectedRegularActivities]:
    strings.surveyButton.notAtAll,
  [strings.surveyTitle.smokeTobacco]: strings.surveyButton.yes,
  [strings.surveyTitle.householdTobacco]: strings.surveyButton.yes,
  [strings.surveyTitle.travelOutsideState.replace("{{state}}", "wa")]: strings
    .surveyButton.yes,
  [strings.surveyTitle.travelOutsideUS]: strings.surveyButton.yes,
  [strings.surveyTitle.peopleInHousehold]: strings.surveyButton.liveByMyself,
  [strings.surveyTitle.inContact]: strings.surveyButton.yes,
  [strings.surveyTitle.publicTransportation]: strings.surveyButton.yes,
  [strings.surveyTitle.aroundSickChildren]: strings.surveyButton.yes,
  [strings.surveyTitle.futureStudies]: strings.surveyButton.yes,
  [strings.surveyTitle.blueLine]: strings.surveyButton.yes,
  [strings.surveyTitle.pinkLine]: strings.surveyButton.noPink,
};
