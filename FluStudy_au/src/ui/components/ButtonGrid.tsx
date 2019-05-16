// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { RefObject } from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { ScrollIntoView } from "react-native-scroll-into-view";
import { SurveyQuestionData } from "../../resources/ScreenConfig";
import {
  BORDER_WIDTH,
  BUTTON_BORDER_RADIUS,
  GUTTER,
  HIGHLIGHT_STYLE,
  RADIO_BUTTON_HEIGHT,
  SECONDARY_COLOR,
  TEXT_COLOR,
} from "../styles";
import QuestionText from "./QuestionText";
import Text from "./Text";

interface Props {
  highlighted?: boolean;
  onRef?: RefObject<any>;
  question: SurveyQuestionData;
  getAnswer(key: string, id: string): any;
  updateAnswer(answer: object, data: SurveyQuestionData): void;
}

interface State {
  selected: string | undefined;
}

class ButtonGrid extends React.Component<Props & WithNamespaces, State> {
  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = {
      selected: props.getAnswer("selectedButtonKey", props.question.id),
    };
  }

  render() {
    const { highlighted, onRef, question, t, updateAnswer } = this.props;
    return (
      <ScrollIntoView onMount={false} style={styles.container} ref={onRef}>
        <QuestionText question={question} />
        <View
          style={[
            styles.buttonContainer,
            question.buttons.length < 3 && { width: "67%" },
          ]}
        >
          {question.buttons.map((button, index) => {
            return (
              <TouchableOpacity
                key={button.key}
                onPress={() => {
                  const selected =
                    this.state.selected === button.key ? undefined : button.key;
                  this.setState({ selected });
                  updateAnswer({ selectedButtonKey: selected }, question);
                }}
                style={[
                  styles.button,
                  index === 0 && styles.buttonFirst,
                  index === question.buttons.length - 1 && styles.buttonLast,
                  this.state.selected === button.key && styles.selectedButton,
                  !!highlighted && HIGHLIGHT_STYLE,
                ]}
              >
                <Text
                  bold={true}
                  center={true}
                  content={t("surveyButton:" + button.key)}
                  style={[
                    styles.buttonText,
                    this.state.selected === button.key &&
                      styles.selectedButtonText,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollIntoView>
    );
  }
}
export default withNamespaces()(ButtonGrid);

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "row",
  },
  button: {
    borderColor: TEXT_COLOR,
    borderBottomWidth: BORDER_WIDTH,
    borderLeftWidth: BORDER_WIDTH,
    borderTopWidth: BORDER_WIDTH,
    flex: 1,
    height: RADIO_BUTTON_HEIGHT,
    justifyContent: "center",
  },
  buttonFirst: {
    borderLeftWidth: BORDER_WIDTH,
    borderBottomLeftRadius: BUTTON_BORDER_RADIUS,
    borderTopLeftRadius: BUTTON_BORDER_RADIUS,
  },
  buttonLast: {
    borderBottomRightRadius: BUTTON_BORDER_RADIUS,
    borderRightWidth: BORDER_WIDTH,
    borderTopRightRadius: BUTTON_BORDER_RADIUS,
  },
  buttonText: {
    color: TEXT_COLOR,
  },
  container: {
    alignSelf: "stretch",
    marginBottom: GUTTER,
  },
  selectedButton: {
    backgroundColor: SECONDARY_COLOR,
    borderColor: SECONDARY_COLOR,
  },
  selectedButtonText: {
    color: "white",
  },
});
