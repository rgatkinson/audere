// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { getStore, StoreState } from "../store";

export async function getRdtResult() {
  const state: StoreState = (await getStore()).getState();
  let testResult = "unknown";
  if (state.survey.rdtInfo && state.survey.rdtInfo.rdtReaderResult) {
    const result = state.survey.rdtInfo.rdtReaderResult;
    if (!result.testStripFound || !result.controlLineFound) {
      testResult = "invalid";
    } else {
      if (!result.testALineFound && !result.testBLineFound) {
        testResult = "negative";
      } else if (result.testALineFound && result.testBLineFound) {
        testResult = "positive for flu a and flu b";
      } else if (result.testALineFound) {
        testResult = "positive for flu a";
      } else {
        testResult = "positive for flu b";
      }
    }
  }
  return { testResult };
}
