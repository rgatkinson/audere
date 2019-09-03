// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { default as meta, MetaState } from "./meta";
import { default as questions, QuestionsState } from "./questions";
import { default as survey, SurveyState } from "./survey";

export interface StoreState {
  meta: MetaState;
  navigation: any;
  questions: QuestionsState;
  survey: SurveyState;
}
