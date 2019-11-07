// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { getStore } from "../store";
import { getAnswer } from "./survey";
import { WhatSymptomsConfig } from "audere-lib/chillsQuestionConfig";

export async function getSymptomsNextScreen() {
  const state = (await getStore()).getState();
  const symptoms = getAnswer(state, WhatSymptomsConfig);
  return symptoms.some((s: any) => s.key === "noneOfTheAbove" && s.selected)
    ? "IllnessBeginnings"
    : "SymptomsInfo";
}
