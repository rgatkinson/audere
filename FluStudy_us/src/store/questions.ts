// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import i18n from "i18next";
import {
  ButtonLabel,
  OptionLabel,
  SurveyAnswer,
  SurveyResponse,
} from "./types";
import {
  MultiDropDownQuestion,
  OptionQuestion,
  SurveyQuestion,
} from "audere-lib/chillsQuestionConfig";
import { SURVEY_QUESTIONS } from "audere-lib/chillsQuestionConfig";

export type QuestionsAction = {
  type: "UPDATE_RESPONSE";
  answer: SurveyAnswer;
  question: OptionQuestion | SurveyQuestion;
  textVariables?: any;
};

function asLiterals<T extends string>(arr: T[]): T[] {
  return arr;
}
const keys = asLiterals(SURVEY_QUESTIONS.map(question => question.id));
export type QuestionsState = { [K in (typeof keys)[number]]?: SurveyResponse };

export default function reducer(state = {}, action: QuestionsAction) {
  switch (action.type) {
    case "UPDATE_RESPONSE":
      return {
        ...state,
        [action.question.id]: updateResponse(
          state,
          action.answer,
          action.question,
          action.textVariables
        ),
      };

    default:
      return state;
  }
}

function initializeResponse(
  data: MultiDropDownQuestion | OptionQuestion | SurveyQuestion,
  textVariables?: any
): SurveyResponse {
  const buttonLabels: ButtonLabel[] = [];
  data.buttons.forEach(button => {
    buttonLabels.push({
      key: button.key,
      label: i18n.t("surveyButton:" + button.key),
    });
  });

  const optionLabels: OptionLabel[] = [];
  if (data.type === "optionQuestion" || data.type === "multiDropdown") {
    const optionQuestion = data as OptionQuestion | MultiDropDownQuestion;
    optionQuestion.options.forEach((option: string) => {
      optionLabels.push({
        key: option,
        label: i18n.t("surveyOption:" + option),
      });
    });
  }

  return {
    answer: {},
    buttonLabels,
    optionLabels,
    questionId: data.id,
    questionText: (
      (data.title ? i18n.t("surveyTitle:" + data.title, textVariables) : "") +
      " " +
      (data.description
        ? i18n.t("surveyDescription:" + data.description, textVariables)
        : "")
    ).trim(),
  };
}

function updateResponse(
  state: QuestionsState,
  answer: SurveyAnswer,
  question: SurveyQuestion,
  textVariables?: any
) {
  let response = state[question.id];
  if (response == null) {
    response = initializeResponse(question, textVariables);
  }
  response.answer = { ...response.answer, ...answer };
  return response;
}

export function updateAnswer(
  answer: SurveyAnswer,
  question: SurveyQuestion,
  textVariables?: any
): QuestionsAction {
  return {
    type: "UPDATE_RESPONSE",
    answer,
    question,
    textVariables,
  };
}
