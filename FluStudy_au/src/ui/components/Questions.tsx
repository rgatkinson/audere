// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { RefObject } from "react";
import { connect } from "react-redux";
import { Alert, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { ScrollIntoView } from "react-native-scroll-into-view";
import { Action, Option, StoreState } from "../../store";
import { customRef } from "./CustomRef";
import MonthPicker from "./MonthPicker";
import OptionQuestion from "./OptionQuestion";
import QuestionText from "./QuestionText";
import RadioGrid from "./RadioGrid";
import ButtonGrid from "./ButtonGrid";
import { HIGHLIGHT_STYLE } from "../styles";
import { SurveyQuestionData } from "../../resources/ScreenConfig";
import reduxWriter, { ReduxWriterProps } from "../../store/ReduxWriter";

interface Props {
  questions: SurveyQuestionData[];
  logOnSave?: (getAnswer: (key: string, id: string) => string) => void;
}

interface State {
  triedToProceed: boolean;
}

interface RequiredQuestion {
  ref: RefObject<View>;
  type: string;
}

class Questions extends React.Component<
  Props & WithNamespaces & ReduxWriterProps,
  State
> {
  _requiredQuestions: Map<string, RefObject<any>>;

  constructor(props: Props & WithNamespaces & ReduxWriterProps) {
    super(props);
    this.state = { triedToProceed: false };
    this._requiredQuestions = new Map<string, RefObject<any>>();
    props.questions.map(config => {
      if (config.required) {
        this._requiredQuestions.set(config.id, React.createRef());
      }
    });
  }

  _evaluateConditional(config: SurveyQuestionData): boolean {
    const { getAnswer } = this.props;
    const condition = config.condition;

    if (condition == null) {
      return true;
    }

    switch (condition.key) {
      case "selectedButtonKey":
        return getAnswer(condition.key, condition.id) === condition.answer;
      case "options":
        const options: Option[] = getAnswer("options", condition.id);
        return options.reduce(
          (result: boolean, option: Option) =>
            result || (option.selected && option.key === condition.answer),
          false
        );
    }
    return false;
  }

  validate = () => {
    const { questions, getAnswer, logOnSave } = this.props;
    let valid = true;
    questions.forEach(config => {
      if (
        valid &&
        this._evaluateConditional(config) &&
        config.required &&
        !this._hasAnswer(config)
      ) {
        this.setState({ triedToProceed: true });
        this._requiredQuestions.get(config.id)!.current!.scrollIntoView();
        valid = false;
      }
    });

    valid && !!logOnSave && logOnSave(getAnswer);

    return valid;
  };

  _hasAnswer = (config: SurveyQuestionData) => {
    const { getAnswer } = this.props;
    switch (config.type) {
      case "text":
        return true;
      case "optionQuestion":
        const options: Option[] | any = getAnswer("options", config.id);
        return options
          ? options.reduce(
              (result: boolean, option: Option) => result || option.selected,
              false
            )
          : false;
      case "radioGrid":
      case "buttonGrid":
        return getAnswer("selectedButtonKey", config.id) !== null;
      case "datePicker":
        return getAnswer("dateInput", config.id) !== null;
      default:
        return false;
    }
  };

  render() {
    const { questions, getAnswer, t, updateAnswer } = this.props;

    return questions.map((config, index) => {
      if (this._evaluateConditional(config)) {
        const highlighted =
          config.required &&
          this.state.triedToProceed &&
          !this._hasAnswer(config);

        switch (config.type) {
          case "text":
            return (
              <QuestionText key={`${config.id}-${index}`} question={config} />
            );
          case "optionQuestion":
            return (
              <OptionQuestion
                key={`${config.id}-${index}`}
                question={config}
                highlighted={highlighted}
                onRef={this._requiredQuestions.get(config.id)}
                getAnswer={getAnswer}
                updateAnswer={updateAnswer}
              />
            );
          case "radioGrid":
            return (
              <RadioGrid
                desc={!!config.description}
                key={`${config.id}-${index}`}
                highlighted={highlighted}
                onRef={this._requiredQuestions.get(config.id)}
                question={config}
                getAnswer={getAnswer}
                updateAnswer={updateAnswer}
              />
            );
          case "buttonGrid":
            return (
              <ButtonGrid
                key={`${config.id}-${index}`}
                onRef={this._requiredQuestions.get(config.id)}
                question={config}
                highlighted={highlighted}
                getAnswer={getAnswer}
                updateAnswer={updateAnswer}
              />
            );
          case "datePicker":
            const dateAnswer = getAnswer("dateInput", config.id);
            return (
              <ScrollIntoView
                onMount={false}
                ref={this._requiredQuestions.get(config.id)}
                style={!!highlighted && HIGHLIGHT_STYLE}
                key={`${config.id}-${index}`}
              >
                <QuestionText question={config} />
                <MonthPicker
                  key={`${config.id}-${index}`}
                  date={dateAnswer === null ? dateAnswer : new Date(dateAnswer)}
                  startDate={config.startDate!}
                  endDate={new Date(Date.now())}
                  onDateChange={(dateInput: Date | null) => {
                    updateAnswer({ dateInput }, config);
                  }}
                />
              </ScrollIntoView>
            );
          default:
            break;
        }
      }
    });
  }
}

export default reduxWriter(withNamespaces()(customRef(Questions)));
