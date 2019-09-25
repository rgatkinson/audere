// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import strings from "../../../src/i18n/locales/en.json";

export const inputs = {
  [strings.surveyTitle.researchByAnyResearchers]: strings.surveyButton.yes,
  [strings.barcode.placeholder]: "00400400",
  [strings.surveyTitle.whatSymptoms]: [
    strings.surveyOption.chillsOrSweats,
    strings.surveyOption.shortnessOfBreath,
  ],
  [strings.surveyTitle.symptomsStart]: [
    strings.surveyButton["4days"],
    strings.surveyButton["4days"],
  ],
  [strings.surveyTitle.symptomsLast48]: [
    strings.surveyButton.no,
    strings.surveyButton.yes,
  ],
  [strings.surveyTitle.symptomsSeverity]: [
    strings.surveyButton.mild,
    strings.surveyButton.moderate,
  ],
  [strings.surveyTitle.inContact]: strings.surveyButton.yes,
  [strings.surveyTitle.coughSneeze]: strings.surveyButton.no,
  [strings.surveyTitle.youngChildren]:
    strings.surveyButton.moreThanFiveChildren,
  [strings.surveyTitle.householdChildren]: strings.surveyButton.yes,
  [strings.surveyTitle.childrenWithChildren]: strings.surveyButton.no,
  [strings.surveyTitle.peopleInHousehold]: strings.surveyButton["8plus"],
  [strings.surveyTitle.bedrooms]: strings.surveyButton["4"],
  [strings.surveyTitle.fluShot]: strings.surveyButton.neverFlu,
  [strings.surveyTitle.medicalCondition]: [strings.surveyOption.heartDisease],
  [strings.surveyTitle.healthcareWorker]: strings.surveyButton.yes,
  [strings.surveyTitle.smokeTobacco]: strings.surveyButton.no,
  [strings.surveyTitle.householdTobacco]: strings.surveyButton.yes,
  [strings.surveyTitle.interfering]: strings.surveyButton.no,
  [strings.surveyTitle.antibiotics]: strings.surveyButton.yes,
  [strings.surveyTitle.age]: strings.surveyButton["30to34"],
  [strings.surveyTitle.assignedSex]: strings.surveyButton.preferNotToSay,
  [strings.surveyTitle.race]: [
    strings.surveyOption.asian,
    strings.surveyOption.middleEastNorthAfrican,
  ],
  [strings.surveyTitle.blueLine]: strings.surveyButton.yes,
  [strings.surveyTitle.pinkLine]: strings.surveyButton.yesAboveBelowBlue,
  [strings.surveyTitle.numLinesSeen]: strings.surveyButton.noneOfTheAbove,
  [strings.surveyTitle.TestFeedback]: strings.surveyButton.incorrect,
};
