// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import strings from "../../../src/i18n/locales/en.json";
const today = new Date();

export const inputs = {
  [strings.barcode.placeholder]: "00100100",
  [strings.barcode.secondPlaceholder]: "00100100",
  [strings.EmailConfirmation.placeholder]: "juan@auderenow.org",
  [strings.surveyTitle.whatSymptoms]: [
    strings.surveyOption.feelingFeverish,
    strings.surveyOption.headache,
  ],
  [strings.surveyTitle.symptomsStart]: [
    strings.surveyButton["1day"],
    strings.surveyButton["1day"],
  ],
  [strings.surveyTitle.symptomsLast48]: [
    strings.surveyButton.yes,
    strings.surveyButton.yes,
  ],
  [strings.surveyTitle.symptomsSeverity]: [
    strings.surveyButton.mild,
    strings.surveyButton.mild,
  ],
  [strings.surveyTitle.inContact]: strings.surveyButton.yes,
  [strings.surveyTitle.coughSneeze]: strings.surveyButton.yes,
  [strings.surveyTitle.youngChildren]: strings.surveyButton.noContactUnderFive,
  [strings.surveyTitle.householdChildren]: strings.surveyButton.yes,
  [strings.surveyTitle.childrenWithChildren]: strings.surveyButton.yes,
  [strings.surveyTitle.peopleInHousehold]: strings.surveyButton["1to2"],
  [strings.surveyTitle.bedrooms]: strings.surveyButton["0-1"],
  [strings.surveyTitle.fluShot]: strings.surveyButton.yes,
  [strings.surveyTitle.fluShotDate]: `${new Intl.DateTimeFormat("en-US", {
    month: "long",
  }).format(today)} ${today.getFullYear()}`,
  [strings.surveyTitle.previousSeason]: strings.surveyButton.yes,
  [strings.surveyTitle.medicalCondition]: [strings.surveyOption.asthma],
  [strings.surveyTitle.healthcareWorker]: strings.surveyButton.yes,
  [strings.surveyTitle.smokeTobacco]: strings.surveyButton.yes,
  [strings.surveyTitle.householdTobacco]: strings.surveyButton.yes,
  [strings.surveyTitle.interfering]: strings.surveyButton.yes,
  [strings.surveyTitle.antibiotics]: strings.surveyButton.yes,
  [strings.surveyTitle.antiviral]: strings.surveyButton.yes,
  [strings.surveyTitle.age]: strings.surveyButton["18to19"],
  [strings.surveyTitle.assignedSex]: strings.surveyButton.male,
  [strings.surveyTitle.race]: [
    strings.surveyOption.americanIndianOrAlaskanNative,
    strings.surveyOption.other,
  ],
  [strings.surveyTitle.blueLine]: strings.surveyButton.yes,
  [strings.surveyTitle.pinkLine]: strings.surveyButton.noPink,
};
