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
} from "./index";
import { Dissoc } from "subtractiontype.ts";
import { connect } from "react-redux";
import { i18n, WithNamespaces, withNamespaces } from "react-i18next";
import { SurveyQuestionData } from "../resources/ScreenConfig";

interface InnerProps {
  data?: SurveyQuestionData;
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
  responses: SurveyResponse[];
  t(key: string): string;
  tReady: boolean;
  i18n: i18n;
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
    InnerProps & OuterProps<P> & WithNamespaces,
    State
  > {
    constructor(props: InnerProps & OuterProps<P>) {
      super(props);
      this.state = {
        data:
          !!this.props.navigation && !!this.props.navigation.getParam("data")
            ? this.props.navigation.getParam("data")
            : this.props.data,
      };
    }

    componentDidMount() {
      const responses = this.props.responses.slice(0);
      const response = responses.find(
        response => response.questionId === this.state.data.id
      );
      if (response == null) {
        responses.push(this._initializeResponse());
        this.props.dispatch(this.state.data.updateFunction(responses));
      }
    }

    _initializeResponse = (
      data: SurveyQuestionData = this.state.data
    ): SurveyResponse => {
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
          (data.description
            ? t("surveyDescription:" + data.description!.label)
            : "")
        ).trim(),
      };
    };

    _updateAnswer = (
      update: SurveyAnswer,
      data: SurveyQuestionData = this.state.data
    ) => {
      const responses = this.props.responses.slice(0);
      let response = responses.find(
        response => response.questionId === data.id
      );
      if (response == null) {
        response = this._initializeResponse(data);
        responses.push(response);
      }
      response.answer = { ...response.answer, ...update };
      this.props.dispatch(this.state.data.updateFunction(responses));
    };

    _getAnswer = (key: string, id: string = this.state.data.id): any => {
      const response = this.props.responses.find(
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

  const mapStateToProps = function(
    state: StoreState,
    ownProps: InnerProps & OuterProps<P>
  ) {
    const data =
      !!ownProps.navigation && !!ownProps.navigation.getParam("data")
        ? ownProps.navigation.getParam("data")
        : ownProps.data;

    return {
      // @ts-ignore
      responses: state[data.responseType].responses,
    };
  };

  const Enhanced = withNamespaces()(connect(mapStateToProps)(ReduxWriter));

  // @ts-ignore
  Enhanced.navigationOptions = WrappedComponent.navigationOptions;

  return Enhanced;
}
