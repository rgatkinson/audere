// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import strings from "../../../src/i18n/locales/en.json";

export const inputs = {
  [strings.surveyTitle.researchBySameResearchers]: strings.surveyButton.no,
  [strings.barcode.placeholder]: "00200200",
  [strings.barcode.secondPlaceholder]: "00200200",
  [strings.surveyTitle.whatSymptoms]: [
    strings.surveyOption.cough,
    strings.surveyOption.muscleOrBodyAches,
  ],
  [strings.surveyTitle.symptomsStart]: [
    strings.surveyButton["2days"],
    strings.surveyButton["2days"],
  ],
  [strings.surveyTitle.symptomsLast48]: [
    strings.surveyButton.no,
    strings.surveyButton.no,
  ],
  [strings.surveyTitle.symptomsSeverity]: [
    strings.surveyButton.moderate,
    strings.surveyButton.moderate,
  ],
  [strings.surveyTitle.inContact]: strings.surveyButton.no,
  [strings.surveyTitle.youngChildren]: strings.surveyButton.oneChild,
  [strings.surveyTitle.householdChildren]: strings.surveyButton.no,
  [strings.surveyTitle.peopleInHousehold]: strings.surveyButton["3to4"],
  [strings.surveyTitle.bedrooms]: strings.surveyButton["2"],
  [strings.surveyTitle.fluShot]: strings.surveyButton.no,
  [strings.surveyTitle.previousSeason]: strings.surveyButton.no,
  [strings.surveyTitle.medicalCondition]: [strings.surveyOption.copd],
  [strings.surveyTitle.healthcareWorker]: strings.surveyButton.no,
  [strings.surveyTitle.smokeTobacco]: strings.surveyButton.no,
  [strings.surveyTitle.householdTobacco]: strings.surveyButton.no,
  [strings.surveyTitle.interfering]: strings.surveyButton.no,
  [strings.surveyTitle.antibiotics]: strings.surveyButton.no,
  [strings.surveyTitle.age]: strings.surveyButton["20to24"],
  [strings.surveyTitle.assignedSex]: strings.surveyButton.female,
  [strings.surveyTitle.race]: [
    strings.surveyOption.torresStraitIslander,
    strings.surveyOption.whiteAustralian,
  ],
  [strings.surveyTitle.blueLine]: strings.surveyButton.yes,
  [strings.surveyTitle.pinkLine]: strings.surveyButton.yesAboveBlue + " ?",
  [strings.surveyTitle.TestFeedback]: strings.surveyButton.confusingCorrect,
};
