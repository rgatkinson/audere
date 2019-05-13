// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { connect } from "react-redux";
import {
  Alert,
  View,
} from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { NavigationScreenProp } from "react-navigation";
import { ScrollIntoView } from "react-native-scroll-into-view";
import { Action, Option, StoreState } from "../../store";
import MonthPicker from "./MonthPicker";
import OptionQuestion from "./OptionQuestion";
import QuestionText from "./QuestionText";
import RadioGrid from "./RadioGrid";
import ButtonGrid from "./ButtonGrid";
import {
  HIGHLIGHT_STYLE,
} from "../styles";
import { setShownOfflineWarning } from "../../store";
import { SurveyQuestionData } from "../../resources/ScreenConfig";
interface Props {
  questions?: SurveyQuestionData[];
  dispatch?(action: Action): void;
  hideQuestionText?: boolean;
  isConnected?: boolean;
  navigation: NavigationScreenProp<any, any>;
  shownOfflineWarning?: boolean;
  triedToProceed?: boolean;
  getAnswer?: (key: string, id: string) => string;
  updateAnswer?: (answer: object, data: SurveyQuestionData) => void;
  dispatch?(action: Action): void;
  onNext?: () => void;
}

interface ScreenState {
    triedToProceed: boolean;
  }

@connect((state: StoreState) => ({
  isConnected: state.meta.isConnected,
  shownOfflineWarning: state.meta.shownOfflineWarning,
}))
class Questions extends React.Component<Props & WithNamespaces, ScreenState> {

  requiredQuestions = {};

  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = { triedToProceed: false };
  }

  _evaluateConditional(config: SurveyQuestionData): boolean {
    const { getAnswer } = this.props;
    return (
      !!config.condition &&
      !!getAnswer &&
      getAnswer(config.condition!.key, config.condition!.id) ===
        config.condition!.answer
    );
  }

  _validateQuestions = () => {
    if (this.props.questions == null) {
      !!this.props.onNext && this.props.onNext();
      return;
    }

    let firstRequired: any | null = null;

    Object.keys(this.requiredQuestions).forEach((questionId: string) => {
      const type = (this.requiredQuestions as any)[questionId].type;
      const hasAnswer = this._hasAnswer(questionId, type);

      if (!hasAnswer && firstRequired === null) {
        firstRequired = (this.requiredQuestions as any)[questionId].ref;
      }
    });

    if (!!firstRequired) {
      this.setState({ triedToProceed: true });
      (firstRequired as any).scrollIntoView();
    } else {
      this.setState({ triedToProceed: false });
    //   this._handleNavigation();
    // set the parent state of triedToProceed?
    }
  };

  _hasAnswer = (id: string, type: string) => {
    const { getAnswer } = this.props;
    switch (type) {
      case "optionQuestion":
        const options: Option[] | any = !!getAnswer
          ? getAnswer("options", id)
          : [];
        return options
          ? options.reduce(
              (result: boolean, option: Option) => result || option.selected,
              false
            )
          : false;
      case "radioGrid":
      case "buttonGrid":
        return !!getAnswer && getAnswer("selectedButtonKey", id) !== null;
      case "datePicker":
        return !!getAnswer && getAnswer("dateInput", id) !== null;
      default:
        return false;
    }
  };

  render() {
    const {
      hideQuestionText,
      questions,
      getAnswer,
      t,
      updateAnswer,
    } = this.props;

    if (!!questions && !!getAnswer && !!updateAnswer) {
      return questions.map((config, index) => {
        if (
          (!!config.condition && this._evaluateConditional(config)) ||
          !config.condition
        ) {
          let highlighted = false;

          if (config.required) {
            (this.requiredQuestions as any)[config.id] = {
              ref: React.createRef<View>(),
              type: config.type,
            };

            const hasAnswer = this._hasAnswer(config.id, config.type);

            if (this.props.triedToProceed && !hasAnswer) {
              highlighted = true;
            }
          }

          switch (config.type) {
            case "optionQuestion":
              return (
                <OptionQuestion
                  key={`${config.id}-${index}`}
                  question={config}
                  hideQuestionText={hideQuestionText}
                  highlighted={highlighted}
                  onRef={(ref: any) => {
                    if (config.required) {
                      (this.requiredQuestions as any)[config.id].ref = ref;
                    }
                  }}
                  getAnswer={getAnswer}
                  updateAnswer={updateAnswer}
                />
              );
            case "radioGrid":
              return (
                <RadioGrid
                  desc={!!config.description}
                  key={`${config.id}-${index}`}
                  hideQuestion={hideQuestionText}
                  highlighted={highlighted}
                  onRef={(ref: any) => {
                    if (config.required) {
                      (this.requiredQuestions as any)[config.id].ref = ref;
                    }
                  }}
                  question={config}
                  getAnswer={getAnswer}
                  updateAnswer={updateAnswer}
                />
              );
            case "buttonGrid":
              return (
                <ButtonGrid
                  key={`${config.id}-${index}`}
                  onRef={(ref: any) => {
                    if (config.required) {
                      (this.requiredQuestions as any)[config.id].ref = ref;
                    }
                  }}
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
                  ref={
                    config.required &&
                    (this.requiredQuestions as any)[config.id].ref
                  }
                  style={!!highlighted && HIGHLIGHT_STYLE}
                  key={`${config.id}-${index}`}
                >
                  <QuestionText text={t("surveyTitle:" + config.title)} />
                  <MonthPicker
                    key={`${config.id}-${index}`}
                    date={
                      dateAnswer === null ? dateAnswer : new Date(dateAnswer)
                    }
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
    } else {
      return <View />;
    }
  };
}

export default withNamespaces()(Questions);
