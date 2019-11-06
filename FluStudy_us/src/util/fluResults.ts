// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  logFirebaseEvent,
  FunnelEvents,
  RDTInterpretationEventTypes,
} from "./tracker";
import { getStore } from "../store";
import { getSelectedButton } from "./survey";
import {
  BlueLineConfig,
  PinkWhenBlueConfig,
} from "audere-lib/chillsQuestionConfig";
import { getRemoteConfig } from "../util/remoteConfig";

let _previousBlueAnswer: string | undefined;
let _previousPinkAnswer: string | undefined;

export async function getTestStripSurveyNextScreen() {
  const state = (await getStore()).getState();
  const blueAnswer = getSelectedButton(state, BlueLineConfig);
  return blueAnswer === "yes"
    ? "TestStripSurvey2"
    : getPinkWhenBlueNextScreen();
}

export function getPinkWhenBlueNextScreen() {
  return getRemoteConfig("rdtTimeoutSeconds") > 0
    ? "RDTInstructions"
    : "NonRDTInstructions";
}

export async function logFluResult() {
  const state = (await getStore()).getState();

  const blueAnswer = getSelectedButton(state, BlueLineConfig);
  if (_previousBlueAnswer && _previousBlueAnswer !== blueAnswer) {
    logFirebaseEvent(FunnelEvents.BLUE_ANSWER_CHANGED, {
      old_answer: _previousBlueAnswer,
      new_answer: blueAnswer,
    });
  }
  _previousBlueAnswer = blueAnswer;

  const pinkAnswer = getSelectedButton(state, PinkWhenBlueConfig);
  if (_previousPinkAnswer && _previousPinkAnswer !== pinkAnswer) {
    logFirebaseEvent(FunnelEvents.PINK_ANSWER_CHANGED, {
      old_answer: _previousPinkAnswer,
      new_answer: pinkAnswer,
    });
  }
  _previousPinkAnswer = pinkAnswer;
}

export function getExplanationRedAnswer(redAnswer: string | undefined) {
  switch (redAnswer) {
    case "yesAboveBlue":
      return "onePinkAndBlue";
    case "yesBelowBlue":
      return "onePinkAndBlue";
    case "yesAboveBelowBlue":
      return "onePinkAndBlue";
    default:
      return "noPink";
  }
}

export function getResultRedAnswer(redAnswer: string | undefined) {
  switch (redAnswer) {
    case "yesAboveBlue":
      return "positive";
    case "yesBelowBlue":
      return "positive";
    case "yesAboveBelowBlue":
      return "positive";
    default:
      return "negative";
  }
}

export function isShowRDTInterpretationOfType(
  eventType: RDTInterpretationEventTypes
): boolean {
  const interpreter = getRemoteConfig("showRDTInterpretation") as
    | RDTInterpretationEventTypes
    | "";
  if (eventType === RDTInterpretationEventTypes.None && !interpreter) {
    return true;
  }
  return (
    !!interpreter &&
    interpreter.toString().toLowerCase() === eventType.toLowerCase()
  );
}
