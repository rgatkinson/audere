// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import strings from "../../../src/i18n/locales/en.json";
const today = new Date();

export const inputs = {
  [strings.barcode.placeholder]: "00100100",
  [strings.barcode.secondPlaceholder]: "00100100",
  [strings.surveyTitle.whatSymptoms]: [
    strings.surveyOption.cough,
    strings.surveyOption.feelingFeverish,
    strings.surveyOption.chillsOrSweats,
    strings.surveyOption.soreThroat,
    strings.surveyOption.shortnessOfBreath,
  ],
  [strings.surveyTitle.symptomsStart]: [
    strings.surveyButton["2days"],
    strings.surveyButton["3days"],
    strings.surveyButton["1day"],
    strings.surveyButton["4days"],
    strings.surveyButton["1day"],
  ],
  [strings.surveyTitle.symptomsLast48]: [
    strings.surveyButton.yes,
    strings.surveyButton.no,
    strings.surveyButton.yes,
    strings.surveyButton.no,
    strings.surveyButton.yes,
  ],
  [strings.surveyTitle.symptomsSeverity]: [
    strings.surveyButton.moderate,
    strings.surveyButton.mild,
    strings.surveyButton.severe,
    strings.surveyButton.moderate,
    strings.surveyButton.mild,
  ],
  [strings.surveyTitle.inContact]: strings.surveyButton.yes,
  [strings.surveyTitle.coughSneeze]: strings.surveyButton.no,
  [strings.surveyTitle.youngChildren]: strings.surveyButton.twoToFiveChildren,
  [strings.surveyTitle.householdChildren]: strings.surveyButton.yes,
  [strings.surveyTitle.childrenWithChildren]: strings.surveyButton.no,
  [strings.surveyTitle.peopleInHousehold]: strings.surveyButton["1to2"],
  [strings.surveyTitle.bedrooms]: strings.surveyButton["3"],
  [strings.surveyTitle.fluShot]: strings.surveyButton.yes,
  [strings.surveyTitle.fluShotDate]: `${new Intl.DateTimeFormat("en-US", {
    month: "long",
  }).format(today)} ${today.getFullYear()}`,
  [strings.surveyTitle.fluShotNationalImmunization]: strings.surveyButton.no,
  [strings.surveyTitle.previousSeason]: strings.surveyButton.neverFlu,
  [strings.surveyTitle.medicalCondition]: [
    strings.surveyOption.copd,
    strings.surveyOption.diabetes,
  ],
  [strings.surveyTitle.healthcareWorker]: strings.surveyButton.no,
  [strings.surveyTitle.smokeTobacco]: strings.surveyButton.no,
  [strings.surveyTitle.householdTobacco]: strings.surveyButton.no,
  [strings.surveyTitle.interfering]: strings.surveyButton.no,
  [strings.surveyTitle.antibiotics]: strings.surveyButton.yes,
  [strings.dropDown.selectAge]: strings.dropDown["65to69"],
  [strings.surveyTitle.assignedSex]: strings.surveyButton.male,
  [strings.surveyTitle.race]: [
    strings.surveyOption.pacificIslander,
    strings.surveyOption.indianSubcontinent,
  ],
  [strings.surveyTitle.blueLine]: strings.surveyButton.yes,
  [strings.surveyTitle.pinkLine]: strings.surveyButton.noPink,
  [strings.surveyTitle.TestFeedback]: strings.surveyButton.easyCorrect,
};
