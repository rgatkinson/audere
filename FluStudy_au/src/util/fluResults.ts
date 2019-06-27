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
  NumLinesSeenConfig,
} from "audere-lib/coughQuestionConfig";

let _previousBlueAnswer: string | undefined;
let _previousPinkAnswer: string | undefined;
let _previousNumLines: string | undefined;

export async function getTestStripSurveyNextScreen() {
  const state = (await getStore()).getState();
  const blueAnswer = getSelectedButton(state, BlueLineConfig);
  return blueAnswer === "yes" ? "RDTInstructions" : "InvalidResult";
}

export async function getTestStripConfirmationNextScreen() {
  const state = (await getStore()).getState();
  return !!state.survey.rdtInfo &&
    !!state.survey.rdtInfo.rdtReaderResult &&
    state.survey.rdtInfo.rdtReaderResult.testStripFound
    ? "PostRDTTestStripSurvey"
    : "TestResult";
}

export async function logFluResult() {
  const state = (await getStore()).getState();

  const blueAnswer = getSelectedButton(state, BlueLineConfig);
  if (_previousBlueAnswer && _previousBlueAnswer !== blueAnswer) {
    tracker.logEvent(FunnelEvents.BLUE_ANSWER_CHANGED, {
      old_answer: _previousBlueAnswer,
      new_answer: blueAnswer,
    });
  }
  _previousBlueAnswer = blueAnswer;

  const pinkAnswer = getSelectedButton(state, PinkWhenBlueConfig);
  if (_previousPinkAnswer && _previousPinkAnswer !== pinkAnswer) {
    tracker.logEvent(FunnelEvents.PINK_ANSWER_CHANGED, {
      old_answer: _previousPinkAnswer,
      new_answer: pinkAnswer,
    });
  }
  _previousPinkAnswer = pinkAnswer;
}

export async function logNumLines() {
  const state = (await getStore()).getState();

  const numLinesAnswer = getSelectedButton(state, NumLinesSeenConfig);
  if (_previousNumLines && _previousNumLines !== numLinesAnswer) {
    tracker.logEvent(FunnelEvents.NUM_LINES_ANSWER_CHANGED, {
      old_answer: _previousNumLines,
      new_answer: numLinesAnswer,
    });
  }
  _previousNumLines = numLinesAnswer;
}

export function getExplanationRedAnswer(redAnswer: string | undefined) {
  switch (redAnswer) {
    case "yesAboveBlue":
      return "onePinkAndBlue";
    case "yesBelowBlue":
      return "onePinkAndBlue;";
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
