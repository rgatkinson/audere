// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { RefObject, Fragment } from "react";
import {
  Image,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { ScrollIntoView } from "react-native-scroll-into-view";
import { SurveyQuestionData } from "../../resources/QuestionConfig";
import {
  BORDER_WIDTH,
  GUTTER,
  HIGHLIGHT_STYLE,
  ERROR_COLOR,
  FONT_NORMAL,
  RADIO_BUTTON_HEIGHT,
  REGULAR_TEXT,
  SECONDARY_COLOR,
  BORDER_COLOR,
  RADIO_INPUT_HEIGHT,
  TEXT_COLOR,
} from "../styles";
import QuestionText from "./QuestionText";
import Text from "./Text";

interface Props {
  desc?: boolean;
  highlighted?: boolean;
  onRef?: RefObject<any>;
  question: SurveyQuestionData;
  shouldValidate?: boolean;
  validationError?: string;
  style?: StyleProp<ViewStyle>;
  getAnswer(key: string, id: string): any;
  updateAnswer(answer: object, data: SurveyQuestionData): void;
}

interface State {
  selected: string | undefined;
  helpSelected: number | null;
}

class RadioGrid extends React.Component<Props & WithNamespaces, State> {
  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = {
      selected: props.getAnswer("selectedButtonKey", props.question.id),
      helpSelected: null,
    };
  }

  _onPress = (key: string) => {
    const selected = key;

    this.setState({ selected, helpSelected: null });
    this.props.updateAnswer(
      { selectedButtonKey: selected },
      this.props.question
    );
  };

  _toggleHelp = (key: number) => {
    const isSelected = key === this.state.helpSelected ? null : key;
    this.setState({ helpSelected: isSelected });
  };

  render() {
    const {
      highlighted,
      onRef,
      question,
      shouldValidate,
      style,
      t,
      validationError,
    } = this.props;
    const { helpSelected, selected } = this.state;
    return (
      <ScrollIntoView
        onMount={false}
        style={[styles.container, !!style && style]}
        ref={onRef}
      >
        <QuestionText question={question} />
        <View>
          {question.buttons.map((buttonConfig, i) => {
            const isSelected = buttonConfig.key == selected;
            const { helpImageUri, key } = buttonConfig;
            return (
              <Fragment key={`${key}-fragment`}>
                <TouchableOpacity
                  key={key}
                  onPress={() => this._onPress(key)}
                  style={
                    i === question.buttons.length - 1
                      ? styles.radioRowLast
                      : styles.radioRow
                  }
                >
                  <View
                    style={{
                      alignItems: "center",
                      flex: 1,
                      flexDirection: "row",
                    }}
                  >
                    <View
                      style={[
                        styles.radioButton,
                        isSelected && styles.selectedRadioColor,
                        !!highlighted && HIGHLIGHT_STYLE,
                      ]}
                    >
                      {isSelected && <View style={styles.radioButtonCenter} />}
                    </View>
                    <Text
                      style={[
                        styles.radioText,
                        isSelected && styles.selectedRadioColor,
                      ]}
                      content={t(`surveyButton:${key}`)}
                    />
                    {!!helpImageUri && (
                      <TouchableOpacity
                        key={`${key}-touchable`}
                        onPress={() => this._toggleHelp(i)}
                      >
                        <View style={styles.helpIcon}>
                          <Text
                            bold={true}
                            style={{ color: "white" }}
                            content={"?"}
                          />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
                {helpSelected === i && (
                  <TouchableOpacity
                    style={{ height: 200 }}
                    key={`${buttonConfig.key}-image-button`}
                    onPress={() => this.setState({ helpSelected: null })}
                  >
                    <Image
                      key={`${key}-image`}
                      resizeMode={"contain"}
                      style={styles.helpImage}
                      source={{ uri: buttonConfig.helpImageUri }}
                    />
                  </TouchableOpacity>
                )}
              </Fragment>
            );
          })}
          {shouldValidate &&
            !selected &&
            validationError && (
              <Text content={validationError} style={styles.errorText} />
            )}
        </View>
      </ScrollIntoView>
    );
  }
}
export default withNamespaces()(RadioGrid);

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    marginBottom: GUTTER,
  },
  errorText: {
    color: ERROR_COLOR,
    fontFamily: FONT_NORMAL,
    marginTop: GUTTER / 4,
  },
  helpIcon: {
    backgroundColor: SECONDARY_COLOR,
    borderColor: SECONDARY_COLOR,
    borderWidth: 1,
    borderRadius: 20,
    height: 25,
    width: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  helpImage: {
    flex: 1,
    height: undefined,
    marginVertical: GUTTER / 2,
    width: undefined,
  },
  radioButton: {
    borderColor: TEXT_COLOR,
    borderWidth: BORDER_WIDTH,
    borderRadius: RADIO_INPUT_HEIGHT / 2,
    height: RADIO_INPUT_HEIGHT,
    width: RADIO_INPUT_HEIGHT,
  },
  radioButtonCenter: {
    backgroundColor: SECONDARY_COLOR,
    borderRadius: RADIO_INPUT_HEIGHT / 4,
    margin: RADIO_INPUT_HEIGHT / 4 - 1,
    height: RADIO_INPUT_HEIGHT / 2,
    width: RADIO_INPUT_HEIGHT / 2,
  },
  radioRow: {
    borderColor: BORDER_COLOR,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: RADIO_BUTTON_HEIGHT,
  },
  radioRowLast: {
    borderColor: BORDER_COLOR,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: RADIO_BUTTON_HEIGHT,
  },
  radioText: {
    flex: 3,
    fontSize: REGULAR_TEXT,
    margin: GUTTER / 2,
  },
  selectedRadioColor: {
    color: SECONDARY_COLOR,
    borderColor: SECONDARY_COLOR,
  },
});
