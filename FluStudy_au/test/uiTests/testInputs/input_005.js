// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import strings from "../../../src/i18n/locales/en.json";
const today = new Date();

export const inputs = {
  [strings.surveyTitle.researchByAnyResearchers]: strings.surveyButton.yes,
  [strings.barcode.placeholder]: "00500500",
  [strings.surveyTitle.whatSymptoms]: [
    strings.surveyOption.soreThroat,
    strings.surveyOption.vomiting,
  ],
  [strings.surveyTitle.symptomsStart]: [
    strings.surveyButton["1day"],
    strings.surveyButton["2days"],
  ],
  [strings.surveyTitle.symptomsLast48]: [
    strings.surveyButton.yes,
    strings.surveyButton.yes,
  ],
  [strings.surveyTitle.symptomsSeverity]: [
    strings.surveyButton.moderate,
    strings.surveyButton.severe,
  ],
  [strings.surveyTitle.inContact]: strings.surveyButton.yes,
  [strings.surveyTitle.coughSneeze]: strings.surveyButton.dontKnow,
  [strings.surveyTitle.youngChildren]: strings.surveyButton.dontKnow,
  [strings.surveyTitle.householdChildren]: strings.surveyButton.yes,
  [strings.surveyTitle.childrenWithChildren]: strings.surveyButton.dontKnow,
  [strings.surveyTitle.peopleInHousehold]: strings.surveyButton["1to2"],
  [strings.surveyTitle.bedrooms]: strings.surveyButton["5+"],
  [strings.surveyTitle.fluShot]: strings.surveyButton.yes,
  [strings.surveyTitle.fluShotDate]: `January ${today.getFullYear()}`,
  [strings.surveyTitle.fluShotNationalImmunization]: strings.surveyButton.no,
  [strings.surveyTitle.previousSeason]: strings.surveyButton.yes,
  [strings.surveyTitle.medicalCondition]: [strings.surveyOption.noneOfThese],
  [strings.surveyTitle.healthcareWorker]: strings.surveyButton.no,
  [strings.surveyTitle.smokeTobacco]: strings.surveyButton.yes,
  [strings.surveyTitle.householdTobacco]: strings.surveyButton.no,
  [strings.surveyTitle.interfering]: strings.surveyButton.yes,
  [strings.surveyTitle.antibiotics]: strings.surveyButton.dontKnow,
  [strings.surveyTitle.age]: strings.surveyButton["35to39"],
  [strings.surveyTitle.assignedSex]: strings.surveyButton.male,
  [strings.surveyTitle.race]: [
    strings.surveyOption.african,
    strings.surveyOption.indianSubcontinent,
  ],
  [strings.surveyTitle.blueLine]: strings.surveyButton.no,
  [strings.surveyTitle.TestFeedback]: strings.surveyButton.easyCorrect,
};
