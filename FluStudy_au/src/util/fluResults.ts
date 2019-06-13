// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { tracker, FunnelEvents } from "./tracker";
import { getStore } from "../store";
import { getSelectedButton } from "./survey";
import {
  BlueLineConfig,
  PinkWhenBlueConfig,
} from "../resources/QuestionConfig";

export async function getFluResultScreen() {
  const state = (await getStore()).getState();
  const blueAnswer = getSelectedButton(state, BlueLineConfig);
  return blueAnswer === "yes" ? "TestResult" : "InvalidResult";
}

export async function logFluResult() {
  const state = (await getStore()).getState();
  const blueAnswer = getSelectedButton(state, BlueLineConfig);

  switch (blueAnswer) {
    case "yes":
      const redAnswer = getSelectedButton(state, PinkWhenBlueConfig);
      tracker.logEvent(FunnelEvents.RESULT_BLUE);
      switch (redAnswer) {
        case "yesAboveBlue":
        case "yesBelowBlue":
        case "yesAboveBelowBlue":
          tracker.logEvent(FunnelEvents.RESULT_BLUE_ANY_PINK);
          break;
        case "noRed":
          tracker.logEvent(FunnelEvents.RESULT_BLUE_NO_PINK);
          break;
      }
      break;

    case "no":
      tracker.logEvent(FunnelEvents.RESULT_NO_BLUE);
      break;
  }
}
