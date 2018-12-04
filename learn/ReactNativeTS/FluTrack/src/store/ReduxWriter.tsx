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

interface InnerProps {
  dispatch(action: Action): void;
  navigation?: NavigationScreenProp<any, any>;
  surveyResponses: Map<string, SurveyResponse>;
  t(key: string): string;
}

export interface ReduxWriterProps {
  updateAnswer(answer: object): void;
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

    _initializeResponse = (): [Map<string, SurveyResponse>, SurveyAnswer] => {
      const responses = this.props.surveyResponses
        ? new Map<string, SurveyResponse>(this.props.surveyResponses)
        : new Map<string, SurveyResponse>();

      if (!responses.has(this.state.data.id)) {
        const buttonOptions = new Map<string, string>(
          this.state.data.buttons.map<[string, string]>(
            (button: ButtonConfig) => [
              button.key,
              this.props.t("surveyButton:" + button.key),
            ]
          )
        );

        const optionKeysToLabel = this.state.data.optionList
          ? new Map<string, string>(
              this.state.data.optionList.options.map<[string, string]>(
                optionKey => [
                  optionKey,
                  this.props.t("surveyOption:" + optionKey),
                ]
              )
            )
          : undefined;

        responses.set(this.state.data.id, {
          answer: {},
          buttonOptions: buttonOptions,
          optionKeysToLabel: optionKeysToLabel,
          questionId: this.state.data.id,
          questionText: (
            (this.state.data.title ? this.state.data.title : "") +
            " " +
            (this.state.data.description
              ? this.state.data.description!.label
              : "")
          ).trim(),
        });
      }

      return [
        responses,
        responses.has(this.state.data.id)
          ? responses.get(this.state.data.id)!.answer!
          : {},
      ];
    };

    _updateAnswer = (update: object) => {
      const [responses, existingAnswer] = this._initializeResponse();
      responses.set(this.state.data.id, {
        ...responses.get(this.state.data.id),
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
          this.props.surveyResponses!.has(id) &&
          this.props.surveyResponses!.get(id) &&
          this.props.surveyResponses!.get(id)!.answer &&
          this.props.surveyResponses!.get(id)!.answer![key]) ||
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
