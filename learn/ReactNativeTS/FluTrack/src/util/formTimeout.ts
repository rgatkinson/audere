// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { NavigationScreenProp } from "react-navigation";
import { clearForm, completeSurvey, store } from "../store";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export function completeFormIfExpired(
  navigation: NavigationScreenProp<any, any>
) {
  const completed = store.getState().form.completedSurvey;
  const timestamp = store.getState().form.timestamp;
  if (!completed && !!timestamp) {
    // We have a form in-progress
    const currentIntervalMs = new Date().getTime() - timestamp;

    if (currentIntervalMs >= TWO_HOURS_MS) {
      // This form has already expired, we should clear it
      store.dispatch(completeSurvey());
      store.dispatch(clearForm());
      navigation.popToTop();
    }
  }
}
