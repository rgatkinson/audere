// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import strings from "../../../src/i18n/locales/en.json";

export const inputs = {
  [strings.surveyTitle.researchByTheseResearchers]: strings.surveyButton.yes,
  [strings.surveyTitle.researchByAnyResearchers]: strings.surveyButton.no,
  [strings.barcode.placeholder]: "00300300",
  [strings.barcode.secondPlaceholder]: "00300300",
  [strings.surveyTitle.whatSymptoms]: [
    strings.surveyOption.fatigue,
    strings.surveyOption.runningNose,
  ],
  [strings.surveyTitle.symptomsStart]: [
    strings.surveyButton["3days"],
    strings.surveyButton["3days"],
  ],
  [strings.surveyTitle.symptomsLast48]: [
    strings.surveyButton.yes,
    strings.surveyButton.no,
  ],
  [strings.surveyTitle.symptomsSeverity]: [
    strings.surveyButton.severe,
    strings.surveyButton.severe,
  ],
  [strings.surveyTitle.inContact]: strings.surveyButton.dontKnow,
  [strings.surveyTitle.youngChildren]: strings.surveyButton.twoToFiveChildren,
  [strings.surveyTitle.householdChildren]: strings.surveyButton.dontKnow,
  [strings.surveyTitle.peopleInHousehold]: strings.surveyButton["5to7"],
  [strings.surveyTitle.bedrooms]: strings.surveyButton["3"],
  [strings.surveyTitle.fluShot]: strings.surveyButton.dontKnow,
  [strings.surveyTitle.previousSeason]: strings.surveyButton.dontKnow,
  [strings.surveyTitle.medicalCondition]: [strings.surveyOption.diabetes],
  [strings.surveyTitle.healthcareWorker]: strings.surveyButton.dontKnow,
  [strings.surveyTitle.smokeTobacco]: strings.surveyButton.yes,
  [strings.surveyTitle.householdTobacco]: strings.surveyButton.no,
  [strings.surveyTitle.interfering]: strings.surveyButton.yes,
  [strings.surveyTitle.antibiotics]: strings.surveyButton.dontKnow,
  [strings.surveyTitle.age]: strings.surveyButton["25to29"],
  [strings.surveyTitle.assignedSex]: strings.surveyButton.indeterminate,
  [strings.surveyTitle.race]: [
    strings.surveyOption.pacificIslander,
    strings.surveyOption.southOrCentralAmerican,
  ],
  [strings.surveyTitle.blueLine]: strings.surveyButton.yes,
  [strings.surveyTitle.pinkLine]: strings.surveyButton.yesBelowBlue + " ?",
  [strings.surveyTitle.TestFeedback]: strings.surveyButton.confusingNotCorrect,
};
