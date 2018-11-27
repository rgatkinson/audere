import React from "react";
import {
  Action,
  SurveyAnswer,
  SurveyResponse,
  setSurveyResponses,
} from "../../../store";
import { Dissoc } from "subtractiontype.ts";
import { connect } from "react-redux";
import { StoreState } from "../../../store/index";
import { WithNamespaces, withNamespaces } from "react-i18next";

interface ButtonConfig {
  key: string;
}

interface OptionListConfig {
  options: string[];
}

interface InnerProps {
  surveyResponses: Map<string, SurveyResponse>;
  id: string;
  buttons: ButtonConfig[];
  optionList: OptionListConfig;
  title: string;
  description: string;
  t(key: string): string;
  dispatch(action: Action): void;
}

export interface ReduxWriterProps {
  updateAnswer(answer: object): void;
  getAnswer(key: string): any;
}

type OuterProps<P> = Dissoc<P, keyof ReduxWriterProps>;

export default function reduxWriter<P extends ReduxWriterProps>(
  WrappedComponent: React.ComponentType<P>
) {
  class ReduxWriter extends React.Component<InnerProps & OuterProps<P>> {
    _initializeResponse = (): [Map<string, SurveyResponse>, SurveyAnswer] => {
      const responses = this.props.surveyResponses
        ? new Map<string, SurveyResponse>(this.props.surveyResponses)
        : new Map<string, SurveyResponse>();

      if (!responses.has(this.props.id)) {
        const buttonOptions = new Map<string, string>(
          this.props.buttons.map<[string, string]>((button: ButtonConfig) => [
            button.key,
            this.props.t("surveyButton:" + button.key),
          ])
        );

        const optionKeysToLabel = this.props.optionList
          ? new Map<string, string>(
              this.props.optionList.options.map<[string, string]>(optionKey => [
                optionKey,
                this.props.t("surveyOption:" + optionKey),
              ])
            )
          : undefined;

        responses.set(this.props.id, {
          answer: {},
          buttonOptions: buttonOptions,
          optionKeysToLabel: optionKeysToLabel,
          questionId: this.props.id,
          questionText: this.props.title || this.props.description,
        });
      }

      return [
        responses,
        responses.has(this.props.id)
          ? responses.get(this.props.id)!.answer!
          : {},
      ];
    };

    _updateAnswer = (update: object) => {
      const [responses, existingAnswer] = this._initializeResponse();
      responses.set(this.props.id, {
        ...responses.get(this.props.id),
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
          this.props.surveyResponses!.has(this.props.id) &&
          this.props.surveyResponses!.get(this.props.id) &&
          this.props.surveyResponses!.get(this.props.id)!.answer &&
          this.props.surveyResponses!.get(this.props.id)!.answer![key]) ||
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

  return withNamespaces()(connect(mapStateToProps)(ReduxWriter));
}
