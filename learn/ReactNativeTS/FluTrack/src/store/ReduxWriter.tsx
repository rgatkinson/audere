// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { NavigationScreenProp } from "react-navigation";
import {
  Action,
  StoreState,
  SurveyAnswer,
  SurveyResponse,
  setSurveyResponses,
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
import { checkNotNull } from "../util/check";

interface InnerProps {
  dispatch(action: Action): void;
  navigation?: NavigationScreenProp<any, any>;
  surveyResponses: Map<string, SurveyResponse>;
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

    _initializeResponse = (
      data: SurveyQuestionData
    ): [Map<string, SurveyResponse>, SurveyAnswer] => {
      const responses = this.props.surveyResponses
        ? new Map<string, SurveyResponse>(this.props.surveyResponses)
        : new Map<string, SurveyResponse>();

      if (!responses.has(data.id)) {
        const buttonOptions = new Map<string, string>(
          data.buttons.map<[string, string]>((button: ButtonConfig) => [
            button.key,
            this.props.t("surveyButton:" + button.key),
          ])
        );

        const optionKeysToLabel = data.optionList
          ? new Map<string, string>(
              data.optionList.options.map<[string, string]>(optionKey => [
                optionKey,
                this.props.t("surveyOption:" + optionKey),
              ])
            )
          : undefined;

        responses.set(data.id, {
          answer: {},
          buttonOptions: buttonOptions,
          optionKeysToLabel: optionKeysToLabel,
          questionId: data.id,
          questionText: (
            (data.title ? data.title : "") +
            " " +
            (data.description ? data.description!.label : "")
          ).trim(),
        });
      }

      return [
        responses,
        responses.has(data.id) ? responses.get(data.id)!.answer! : {},
      ];
    };

    _updateAnswer = (
      update: object,
      data: SurveyQuestionData = this.state.data
    ) => {
      const [responses, existingAnswer] = this._initializeResponse(data);
      responses.set(data.id, {
        ...checkNotNull(responses.get(data.id)),
        answer: {
          ...existingAnswer,
          ...update,
        },
      });
      this.props.dispatch(setSurveyResponses(responses));
    };

    _getAnswer = (key: string, id: string = this.state.data.id): any => {
      return (
        (!!this.props.surveyResponses &&
          this.props.surveyResponses.has(id) &&
          this.props.surveyResponses.get(id) &&
          this.props.surveyResponses.get(id)!.answer &&
          this.props.surveyResponses.get(id)!.answer![key]) ||
        null
      );
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
      surveyResponses: state.form.surveyResponses,
    };
  };

  const Enhanced = withNamespaces()<SurveyQuestionProps>(
    connect(mapStateToProps)(ReduxWriter)
  );

  // @ts-ignore
  Enhanced.navigationOptions = WrappedComponent.navigationOptions;

  return Enhanced;
}
