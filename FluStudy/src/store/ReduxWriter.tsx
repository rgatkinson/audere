// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { NavigationScreenProp } from "react-navigation";
import {
  Action,
  OptionLabel,
  ButtonLabel,
  StoreState,
  SurveyAnswer,
  SurveyResponse,
  setResponses,
} from "./index";
import { Dissoc } from "subtractiontype.ts";
import { connect } from "react-redux";
import { i18n, WithNamespaces, withNamespaces } from "react-i18next";
import { SurveyQuestionData } from "../resources/ScreenConfig";
import { getStore } from "./index"

interface InnerProps {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
  responses: SurveyResponse[];
  t(key: string): string;
  tReady: boolean;
  i18n: i18n;
}

export interface ReduxWriterProps {
  updateAnswer(answer: object, data: SurveyQuestionData): void;
  getAnswer(key: string, id: string): any;
}

type OuterProps<P> = Dissoc<P, keyof ReduxWriterProps>;

function _getAnswerFromResponses(responses: SurveyResponse[], key: string, id: string) {
  const response = responses.find(
    response => response.questionId === id
  );
  if (
    !response ||
    !response!.answer ||
    (!response!.answer![key] && response.answer![key] !== 0)
  ) {
    return null;
  }
  return response!.answer![key];
}

export const getPriorAnswer = async (key: string, id: string): Promise<any> => {
  return getStore().then(store => {
    return _getAnswerFromResponses(
      store.getState().survey.responses,
      key,
      id);
  });
};

export default function reduxWriter<P extends ReduxWriterProps>(
  WrappedComponent: React.ComponentType<P>
) {
  class ReduxWriter extends React.Component<
    InnerProps & OuterProps<P> & WithNamespaces
  > {
    _initializeResponse = (data: SurveyQuestionData): SurveyResponse => {
      const { t } = this.props;
      const buttonLabels: ButtonLabel[] = [];
      data.buttons.forEach(button => {
        buttonLabels.push({
          key: button.key,
          label: t("surveyButton:" + button.key),
        });
      });

      const optionLabels: OptionLabel[] = [];
      if (!!data.optionList) {
        data.optionList.options.forEach(option => {
          optionLabels.push({
            key: option,
            label: t("surveyOption:" + option),
          });
        });
      }

      return {
        answer: {},
        buttonLabels,
        optionLabels,
        questionId: data.id,
        questionText: (
          (data.title ? t("surveyTitle:" + data.title) : "") +
          " " +
          (data.description ? t("surveyDescription:" + data.description) : "")
        ).trim(),
      };
    };

    _updateAnswer = (update: SurveyAnswer, data: SurveyQuestionData) => {
      const responses = this.props.responses.slice(0);
      let response = responses.find(
        response => response.questionId === data.id
      );
      if (response == null) {
        response = this._initializeResponse(data);
        responses.push(response);
      }
      response.answer = { ...response.answer, ...update };
      this.props.dispatch(setResponses(responses));
    };

    _getAnswer = (key: string, id: string): any => {
      return _getAnswerFromResponses(this.props.responses, key, id);
    };

    render() {
      return (
        <WrappedComponent
          {...this.props}
          updateAnswer={this._updateAnswer}
          getAnswer={this._getAnswer}
        />
      );
    }
  }

  return withNamespaces()(
    connect((state: StoreState) => {
      return {
        responses: state.survey.responses,
      };
    })(ReduxWriter)
  );
}
