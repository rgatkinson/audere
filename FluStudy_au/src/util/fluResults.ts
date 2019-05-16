// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { tracker, FunnelEvents } from "./tracker";
import { BlueLineConfig, RedWhenBlueConfig } from "../resources/ScreenConfig";

export function logFluResult(getAnswer: (key: string, id: string) => string) {
  const blueAnswer = getAnswer("selectedButtonKey", BlueLineConfig.id);

  switch (blueAnswer) {
    case "yes":
      const redAnswer = getAnswer("selectedButtonKey", RedWhenBlueConfig.id);

      tracker.logEvent(FunnelEvents.RESULT_BLUE);
      switch (redAnswer) {
        case "yesAboveBlue":
        case "yesBelowBlue":
        case "yesAboveBelowBlue":
          tracker.logEvent(FunnelEvents.RESULT_BLUE_ANY_RED);
          break;
        case "noRed":
          tracker.logEvent(FunnelEvents.RESULT_BLUE_NO_RED);
          break;
      }
      break;

    case "no":
      tracker.logEvent(FunnelEvents.RESULT_NO_BLUE);
      break;
  }
}
