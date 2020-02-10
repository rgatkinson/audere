// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import { logFirebaseEvent, FunnelEvents } from "./tracker";
import { getStore, StoreState } from "../store";
import { getSelectedButton } from "./survey";
import i18n from "i18next";
import {
  BlueLineConfig,
  PinkWhenBlueConfig,
} from "audere-lib/chillsQuestionConfig";
import { getRemoteConfig } from "../util/remoteConfig";

let _previousBlueAnswer: string | undefined;
let _previousPinkAnswer: string | undefined;

export function canUseRdtReader() {
  return (
    !DeviceInfo.isEmulator() &&
    Platform.OS === "android" &&
    getRemoteConfig("rdtTimeoutSeconds") > 0
  );
}

export async function getTestStripSurveyNextScreen() {
  const state = (await getStore()).getState();
  const blueAnswer = getSelectedButton(state, BlueLineConfig);
  return blueAnswer === "yes"
    ? "TestStripSurvey2"
    : getPinkWhenBlueNextScreen();
}

export function getPinkWhenBlueNextScreen() {
  return canUseRdtReader() ? "RDTInstructions" : "NonRDTInstructions";
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

async function didScanMultiple() {
  const state: StoreState = (await getStore()).getState();
  const screenJustPrior = state.survey.events.slice(-2, -1)[0].refId || "";
  return (
    screenJustPrior === "AndroidRDTReader" &&
    getRemoteConfig("previewFramesSampleRate") > 0
  );
}

export async function getCapturedScreenTextVariables() {
  return {
    desc: (await didScanMultiple())
      ? i18n.t("TestStripConfirmation:descScanned")
      : i18n.t("TestStripConfirmation:descManual"),
  };
}
