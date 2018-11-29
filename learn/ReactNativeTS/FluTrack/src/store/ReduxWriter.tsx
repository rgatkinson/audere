import React from "react";
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

interface InnerProps {
  surveyResponses: Map<string, SurveyResponse>;
  t(key: string): string;
}

export interface ReduxWriterProps {
  updateAnswer(answer: object): void;
  getAnswer(key: string): any;
}

type OuterProps<P> = Dissoc<P, keyof ReduxWriterProps>;

export default function reduxWriter<P extends ReduxWriterProps>(
  WrappedComponent: React.ComponentType<P>
) {
  class ReduxWriter extends React.Component<
    SurveyQuestionProps & InnerProps & OuterProps<P>
  > {
    _initializeResponse = (): [Map<string, SurveyResponse>, SurveyAnswer] => {
      const responses = this.props.surveyResponses
        ? new Map<string, SurveyResponse>(this.props.surveyResponses)
        : new Map<string, SurveyResponse>();

      if (!responses.has(this.props.data.id)) {
        const buttonOptions = new Map<string, string>(
          this.props.data.buttons.map<[string, string]>(
            (button: ButtonConfig) => [
              button.key,
              this.props.t("surveyButton:" + button.key),
            ]
          )
        );

        const optionKeysToLabel = this.props.data.optionList
          ? new Map<string, string>(
              this.props.data.optionList.options.map<[string, string]>(
                optionKey => [
                  optionKey,
                  this.props.t("surveyOption:" + optionKey),
                ]
              )
            )
          : undefined;

        responses.set(this.props.data.id, {
          answer: {},
          buttonOptions: buttonOptions,
          optionKeysToLabel: optionKeysToLabel,
          questionId: this.props.data.id,
          questionText: this.props.data.title || this.props.data.description,
        });
      }

      return [
        responses,
        responses.has(this.props.data.id)
          ? responses.get(this.props.data.id)!.answer!
          : {},
      ];
    };

    _updateAnswer = (update: object) => {
      const [responses, existingAnswer] = this._initializeResponse();
      responses.set(this.props.data.id, {
        ...responses.get(this.props.data.id),
        answer: {
          ...existingAnswer,
          ...update,
        },
      });
      this.props.dispatch(setSurveyResponses(responses));
    };

    _getAnswer = (key: string): any => {
      return (
        (!!this.props.surveyResponses &&
          this.props.surveyResponses!.has(this.props.data.id) &&
          this.props.surveyResponses!.get(this.props.data.id) &&
          this.props.surveyResponses!.get(this.props.data.id)!.answer &&
          this.props.surveyResponses!.get(this.props.data.id)!.answer![key]) ||
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
      surveyResponses: state.form!.surveyResponses,
    };
  };

  return withNamespaces()<SurveyQuestionProps>(
    connect(mapStateToProps)(ReduxWriter)
  );
}
