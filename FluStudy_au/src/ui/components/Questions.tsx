// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { RefObject, Fragment } from "react";
import { StyleSheet, View } from "react-native";
import { NavigationScreenProp, withNavigationFocus } from "react-navigation";
import { ScrollIntoView } from "react-native-scroll-into-view";
import { connect } from "react-redux";
import { getAnswer, getAnswerForID } from "../../util/survey";
import { Action, Option, StoreState } from "../../store";
import { customRef } from "./CustomRef";
import MonthPicker from "./MonthPicker";
import OptionList from "./OptionList";
import QuestionText from "./QuestionText";
import RadioGrid from "./RadioGrid";
import ButtonGrid from "./ButtonGrid";
import TextInputQuestion from "./TextInputQuestion";
import DropDown from "./DropDown";
import {
  DropDownQuestion,
  MonthQuestion,
  OptionQuestion,
  SurveyQuestion,
} from "../../resources/QuestionConfig";

interface Props {
  answers: Map<string, any>;
  conditionals: Map<string, any>;
  isFocused: boolean;
  navigation: NavigationScreenProp<any, any>;
  questions: SurveyQuestion[];
  logOnSave?(): Promise<void>;
}

interface State {
  triedToProceed: boolean;
}

class Questions extends React.Component<Props, State> {
  _requiredQuestions: Map<string, RefObject<any>>;

  constructor(props: Props) {
    super(props);
    this.state = { triedToProceed: false };
    this._requiredQuestions = new Map<string, RefObject<any>>();
    props.questions.map(config => {
      if (config.required) {
        this._requiredQuestions.set(config.id, React.createRef());
      }
    });
  }

  shouldComponentUpdate(props: Props) {
    return props.isFocused;
  }

  _evaluateConditional = (config: SurveyQuestion) => {
    const condition = config.condition;

    if (condition == null) {
      return true;
    }

    const answer = this.props.conditionals.get(config.id);

    switch (condition.key) {
      case "selectedButtonKey":
        return condition.answer === answer;
      case "options":
        const options: Option[] = answer;
        return options.reduce(
          (result: boolean, option: Option) =>
            result || (option.selected && option.key === condition.answer),
          false
        );
    }
    return false;
  };

  validate = () => {
    const { questions, logOnSave } = this.props;
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

    valid && !!logOnSave && logOnSave();

    return valid;
  };

  _hasAnswer = (config: SurveyQuestion) => {
    switch (config.type) {
      case "text":
        return true;
      case "optionQuestion":
        const options: Option[] | undefined = this.props.answers.get(config.id);
        return options
          ? options.reduce(
              (result: boolean, option: Option) => result || option.selected,
              false
            )
          : false;
      case "radioGrid":
      case "buttonGrid":
      case "datePicker":
      case "textInput":
        return this.props.answers.get(config.id) != null;
      default:
        return false;
    }
  };

  _renderQuestion = (config: SurveyQuestion) => {
    const highlighted =
      config.required && this.state.triedToProceed && !this._hasAnswer(config);
    switch (config.type) {
      case "optionQuestion":
        return (
          <OptionList
            highlighted={highlighted}
            question={config as OptionQuestion}
          />
        );
      case "radioGrid":
        return <RadioGrid highlighted={highlighted} question={config} />;
      case "buttonGrid":
        return <ButtonGrid highlighted={highlighted} question={config} />;
      case "datePicker":
        return (
          <MonthPicker
            highlighted={highlighted}
            question={config as MonthQuestion}
          />
        );
      case "textInput":
        return (
          <TextInputQuestion highlighted={highlighted} question={config} />
        );
      case "dropdown":
        return (
          <DropDown
            highlighted={highlighted}
            question={config as DropDownQuestion}
          />
        );
      default:
        return null;
    }
  };

  render() {
    return this.props.questions.map(config => {
      if (this._evaluateConditional(config)) {
        const ref = this._requiredQuestions.get(config.id);
        return (
          <ScrollIntoView onMount={false} ref={ref} key={config.id}>
            <QuestionText question={config} />
            {this._renderQuestion(config)}
          </ScrollIntoView>
        );
      }
    });
  }
}

export default connect((state: StoreState, props: Props) => ({
  answers: props.questions
    .map(question => ({
      id: question.id,
      answer: getAnswer(state, question),
    }))
    .reduce((map, obj) => {
      map.set(obj.id, obj.answer);
      return map;
    }, new Map<string, any>()),
  conditionals: props.questions
    .filter(question => !!question.condition)
    .map(question => ({
      id: question.id,
      answer: getAnswerForID(
        state,
        question.condition!.id,
        question.condition!.key
      ),
    }))
    .reduce((map, obj) => {
      map.set(obj.id, obj.answer);
      return map;
    }, new Map<string, any>()),
}))(withNavigationFocus(customRef(Questions)));
