// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { RefObject, Fragment } from "react";
import { StyleSheet, View } from "react-native";
import { NavigationScreenProp, withNavigationFocus } from "react-navigation";
import { ScrollIntoView } from "react-native-scroll-into-view";
import { Option } from "../../store";
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
import reduxWriter, { ReduxWriterProps } from "../../store/ReduxWriter";

interface Props {
  isFocused: boolean;
  navigation: NavigationScreenProp<any, any>;
  questions: SurveyQuestion[];
  logOnSave?: (getAnswer: (key: string, id: string) => string) => void;
}

interface State {
  triedToProceed: boolean;
}

class Questions extends React.Component<Props & ReduxWriterProps, State> {
  _requiredQuestions: Map<string, RefObject<any>>;

  constructor(props: Props & ReduxWriterProps) {
    super(props);
    this.state = { triedToProceed: false };
    this._requiredQuestions = new Map<string, RefObject<any>>();
    props.questions.map(config => {
      if (config.required) {
        this._requiredQuestions.set(config.id, React.createRef());
      }
    });
  }

  shouldComponentUpdate(props: Props & ReduxWriterProps) {
    return props.isFocused;
  }

  _evaluateConditional(config: SurveyQuestion): boolean {
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

  _hasAnswer = (config: SurveyQuestion) => {
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

  _renderQuestion = (config: SurveyQuestion) => {
    const highlighted =
      config.required && this.state.triedToProceed && !this._hasAnswer(config);
    const { getAnswer, updateAnswer } = this.props;
    switch (config.type) {
      case "optionQuestion":
        return (
          <OptionList
            highlighted={highlighted}
            question={config as OptionQuestion}
            getAnswer={getAnswer}
            updateAnswer={updateAnswer}
          />
        );
      case "radioGrid":
        return (
          <RadioGrid
            highlighted={highlighted}
            question={config}
            getAnswer={getAnswer}
            updateAnswer={updateAnswer}
          />
        );
      case "buttonGrid":
        return (
          <ButtonGrid
            highlighted={highlighted}
            question={config}
            getAnswer={getAnswer}
            updateAnswer={updateAnswer}
          />
        );
      case "datePicker":
        return (
          <MonthPicker
            highlighted={highlighted}
            question={config as MonthQuestion}
            getAnswer={getAnswer}
            updateAnswer={updateAnswer}
          />
        );
      case "textInput":
        return (
          <TextInputQuestion
            highlighted={highlighted}
            question={config}
            getAnswer={getAnswer}
            updateAnswer={updateAnswer}
          />
        );
      case "dropdown":
        return (
          <DropDown
            highlighted={highlighted}
            question={config as DropDownQuestion}
            getAnswer={getAnswer}
            updateAnswer={updateAnswer}
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

export default reduxWriter(withNavigationFocus(customRef(Questions)));
