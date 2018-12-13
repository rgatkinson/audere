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
import { WithNamespaces, withNamespaces } from "react-i18next";
import { SurveyQuestionProps } from "../ui/components/SurveyQuestion";
import {
  ButtonConfig,
  EnabledOption,
  SurveyQuestionData,
} from "../resources/QuestionnaireConfig";

interface InnerProps {
  dispatch(action: Action): void;
  navigation?: NavigationScreenProp<any, any>;
  responses: SurveyResponse[];
  t(key: string): string;
}

export interface ReduxWriterProps {
  updateAnswer(answer: object, data?: SurveyQuestionData): void;
  getAnswer(key: string, id?: string): any;
}

interface State {
  data: SurveyQuestionData;
}

type OuterProps<P> = Dissoc<P, keyof ReduxWriterProps>;

export default function reduxWriter<P extends ReduxWriterProps>(
  WrappedComponent: React.ComponentType<P>
) {
  class ReduxWriter extends React.Component<
    SurveyQuestionProps & InnerProps & OuterProps<P>,
    State
  > {
    constructor(props: SurveyQuestionProps & InnerProps & OuterProps<P>) {
      super(props);
      this.state = {
        data: !!this.props.navigation
          ? this.props.navigation.getParam("data")
          : this.props.data,
      };
    }

    _updateAnswer = (
      update: SurveyAnswer,
      data: SurveyQuestionData = this.state.data
    ) => {
      const { t } = this.props;
      const responses = this.props.responses.slice(0);
      const response = responses.find(
        response => response.questionId === data.id
      );
      if (!response) {
        // Initialize response
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

        responses.push({
          answer: update,
          buttonLabels,
          optionLabels,
          questionId: data.id,
          questionText: (
            (data.title ? t("surveyTitle:" + data.title) : "") +
            " " +
            (data.description
              ? t("surveyDescription:" + data.description!.label)
              : "")
          ).trim(),
        });
      } else {
        response!.answer = { ...response!.answer, ...update };
      }

      this.props.dispatch(setResponses(responses));
    };

    _getAnswer = (key: string, id: string = this.state.data.id): any => {
      const response = this.props.responses.find(
        response => response.questionId === id
      );
      if (!response || !response!.answer || !response!.answer![key]) {
        return null;
      }
      return response!.answer![key];
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

  const mapStateToProps = function(state: StoreState) {
    return {
      responses: state.form.responses,
    };
  };

  const Enhanced = withNamespaces()<SurveyQuestionProps>(
    connect(mapStateToProps)(ReduxWriter)
  );

  // @ts-ignore
  Enhanced.navigationOptions = WrappedComponent.navigationOptions;

  return Enhanced;
}
