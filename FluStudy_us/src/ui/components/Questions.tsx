// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { RefObject } from "react";
import { ScrollIntoView } from "react-native-scroll-into-view";
import { connect } from "react-redux";
import { getAnswer, getAnswerForID } from "../../util/survey";
import { Option, StoreState } from "../../store";
import { customRef } from "./CustomRef";
import DatePicker from "./DatePicker";
import MonthPicker from "./MonthPicker";
import OptionList from "./OptionList";
import QuestionText from "./QuestionText";
import RadioGrid from "./RadioGrid";
import ButtonGrid from "./ButtonGrid";
import NumberInputQuestion from "./NumberInputQuestion";
import TextInputQuestion from "./TextInputQuestion";
import DropDown from "./DropDown";
import MultiDropDown from "./MultiDropDown";
import {
  DropDownQuestion,
  MonthQuestion,
  MultiDropDownQuestion,
  OptionQuestion,
  SurveyQuestion,
  SurveyQuestionType,
  TextQuestion,
  ConditionalQuestionConfig,
} from "audere-lib/chillsQuestionConfig";

interface Props {
  answers: Map<string, any>;
  conditionals: Map<string, any>;
  questions: SurveyQuestion[];
  logOnSave?(): Promise<void>;
  textVariablesFn?(): any;
}

interface State {
  triedToProceed: boolean;
}

class Questions extends React.PureComponent<Props, State> {
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

  _evaluateConditional = (config: SurveyQuestion) => {
    if (config.conditions == null) {
      return true;
    }

    let conditionGroups: ConditionalQuestionConfig[][] = [];
    if (Array.isArray(config.conditions![0])) {
      conditionGroups = config.conditions as ConditionalQuestionConfig[][];
    } else {
      conditionGroups.push(config.conditions as ConditionalQuestionConfig[]);
    }
    return conditionGroups.some(conditionGroup => {
      for (let i = 0; i < conditionGroup.length; i++) {
        const condition = conditionGroup[i];
        const answer = this.props.conditionals.get(condition.id);
        switch (condition.key) {
          case "selectedButtonKey":
            if (!!condition.anythingBut) {
              if (answer === undefined || condition.answer === answer) {
                return false;
              }
            } else if (condition.answer !== answer) {
              return false;
            }
            break;
          case "options":
            const options: Option[] = answer;
            const reduced = options
              ? options.reduce(
                  (result: boolean, option: Option) =>
                    result ||
                    (option.selected && option.key === condition.answer),
                  false
                )
              : null;
            if (!reduced) return false;
            break;
        }
      }
      return true;
    });
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
      case SurveyQuestionType.Text:
        return true;
      case SurveyQuestionType.OptionQuestion:
      case SurveyQuestionType.MultiDropdown:
        const options: Option[] | undefined = this.props.answers.get(config.id);
        return options
          ? options.reduce(
              (result: boolean, option: Option) => result || option.selected,
              false
            )
          : false;
      case SurveyQuestionType.Dropdown:
        return this.props.answers.get(config.id) != null;
      case SurveyQuestionType.RadioGrid:
      case SurveyQuestionType.ButtonGrid:
      case SurveyQuestionType.DatePicker:
      case SurveyQuestionType.MonthPicker:
      case SurveyQuestionType.TextInput:
      case SurveyQuestionType.ZipCodeInput:
        return this.props.answers.get(config.id) != null;
      default:
        return false;
    }
  };

  _renderQuestion = (config: SurveyQuestion) => {
    const highlighted =
      config.required && this.state.triedToProceed && !this._hasAnswer(config);
    switch (config.type) {
      case SurveyQuestionType.OptionQuestion:
        return (
          <OptionList
            highlighted={highlighted}
            question={config as OptionQuestion}
          />
        );
      case SurveyQuestionType.RadioGrid:
        return <RadioGrid highlighted={highlighted} question={config} />;
      case SurveyQuestionType.ButtonGrid:
        return <ButtonGrid highlighted={highlighted} question={config} />;
      case SurveyQuestionType.MonthPicker:
        return (
          <MonthPicker
            highlighted={highlighted}
            question={config as MonthQuestion}
          />
        );
      case SurveyQuestionType.DatePicker:
        return <DatePicker highlighted={highlighted} question={config} />;
      case SurveyQuestionType.TextInput:
        return (
          <TextInputQuestion
            highlighted={highlighted}
            question={config as TextQuestion}
          />
        );
      case SurveyQuestionType.ZipCodeInput:
        return (
          <NumberInputQuestion
            highlighted={highlighted}
            maxDigits={5}
            minDigits={5}
            question={config as TextQuestion}
          />
        );
      case SurveyQuestionType.Dropdown:
        return (
          <DropDown
            highlighted={highlighted}
            question={config as DropDownQuestion}
          />
        );
      case SurveyQuestionType.MultiDropdown:
        return (
          <MultiDropDown
            highlighted={highlighted}
            question={config as MultiDropDownQuestion}
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
            {!!config.title && (
              <QuestionText
                question={config}
                textVariablesFn={this.props.textVariablesFn}
              />
            )}
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
    .map(question => {
      if (!!question.conditions) {
        let conditionGroups: ConditionalQuestionConfig[][] = [];
        if (Array.isArray(question.conditions![0])) {
          conditionGroups = question.conditions as ConditionalQuestionConfig[][];
        } else {
          conditionGroups.push(
            question.conditions as ConditionalQuestionConfig[]
          );
        }

        let answers: { id: string; answer: any }[] = [];
        conditionGroups.forEach(conditionGroup => {
          answers = answers.concat(
            conditionGroup.map(condition => ({
              id: condition.id,
              answer: getAnswerForID(state, condition!.id, condition!.key),
            }))
          );
        });
        return answers;
      } else {
        return {
          id: question.id,
          answer: getAnswer(state, question),
        };
      }
    })
    .reduce((map, obj) => {
      if (Array.isArray(obj)) {
        obj.forEach(item => {
          map.set(item.id, item.answer);
        });
      } else {
        map.set(obj.id, obj.answer);
      }
      return map;
    }, new Map<string, any>()),
}))(customRef(Questions));
