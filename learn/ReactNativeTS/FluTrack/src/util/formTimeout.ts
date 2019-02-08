// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { NavigationScreenProp } from "react-navigation";
import { clearForm, completeSurvey, StoreState } from "../store";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export function completeFormIfExpired(
  state: StoreState,
  dispatch: Function,
  navigation: NavigationScreenProp<any, any>
) {
  if (!state.form) {
    return;
  }
  const completed = state.form.completedSurvey;
  const timestamp = state.form.timestamp;
  if (!completed && !!timestamp) {
    // We have a form in-progress
    const currentIntervalMs = new Date().getTime() - timestamp;

    if (currentIntervalMs >= TWO_HOURS_MS) {
      // This form has already expired, we should clear it
      dispatch(completeSurvey());
      dispatch(clearForm());
      navigation.popToTop();
    }
  }
}
