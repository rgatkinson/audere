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
import { NavigationScreenProp, withNavigationFocus } from "react-navigation";
import { ScrollIntoView } from "react-native-scroll-into-view";
import {
  ButtonConfig,
  SurveyQuestionData,
} from "../../resources/QuestionConfig";
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
  highlighted?: boolean;
  isFocused: boolean;
  navigation: NavigationScreenProp<any, any>;
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
  helpSelected: string | null;
}

class RadioGrid extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      selected: props.getAnswer("selectedButtonKey", props.question.id),
      helpSelected: null,
    };
  }

  shouldComponentUpdate(props: Props) {
    return props.isFocused;
  }

  _onPress = (key: string) => {
    const selected = key;
    this.setState({ selected, helpSelected: null });
    this.props.updateAnswer(
      { selectedButtonKey: selected },
      this.props.question
    );
  };

  _toggleHelp = (key: string) => {
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
        <Fragment>
          {question.buttons.map((buttonConfig, i) => (
            <RadioGridItem
              config={buttonConfig}
              helpSelected={helpSelected === buttonConfig.key}
              highlighted={!!highlighted}
              key={buttonConfig.key}
              last={question.buttons.length - 1 === i}
              selected={buttonConfig.key === selected}
              onPress={this._onPress}
              toggleHelp={this._toggleHelp}
            />
          ))}
          {shouldValidate &&
            !selected &&
            validationError && (
              <Text content={validationError} style={styles.errorText} />
            )}
        </Fragment>
      </ScrollIntoView>
    );
  }
}
export default withNavigationFocus(RadioGrid);

interface ItemProps {
  config: ButtonConfig;
  helpSelected: boolean;
  highlighted: boolean;
  last: boolean;
  selected: boolean;
  onPress: (key: string) => void;
  toggleHelp: (key: string) => void;
}

class Item extends React.Component<ItemProps & WithNamespaces, State> {
  shouldComponentUpdate(props: ItemProps & WithNamespaces) {
    return (
      props.selected != this.props.selected ||
      props.helpSelected != this.props.helpSelected ||
      props.highlighted != this.props.highlighted
    );
  }

  _onPress = () => {
    this.props.onPress(this.props.config.key);
  };

  _toggleHelp = () => {
    this.props.toggleHelp(this.props.config.key);
  };

  render() {
    const { config, helpSelected, highlighted, last, selected, t } = this.props;
    const { key, helpImageUri } = config;
    return (
      <Fragment>
        <TouchableOpacity
          onPress={this._onPress}
          style={last ? styles.radioRowButtonLast : styles.radioRowButton}
        >
          <View style={styles.radioRow}>
            <View
              style={[
                styles.radioButton,
                selected && styles.selectedRadioColor,
                !!highlighted && HIGHLIGHT_STYLE,
              ]}
            >
              {selected && <View style={styles.radioButtonCenter} />}
            </View>
            <Text
              style={[styles.radioText, selected && styles.selectedRadioColor]}
              content={t(`surveyButton:${key}`)}
            />
            {!!helpImageUri && (
              <TouchableOpacity
                key={`${key}-touchable`}
                onPress={this._toggleHelp}
                style={styles.helpIconButton}
              >
                <View style={styles.helpIcon}>
                  <Text bold={true} style={{ color: "white" }} content={"?"} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
        {helpSelected &&
          !!helpImageUri && (
            <TouchableOpacity
              style={{ height: 200 }}
              key={`${key}-image-button`}
              onPress={this._toggleHelp}
            >
              <Image
                key={`${key}-image`}
                resizeMode={"contain"}
                style={styles.helpImage}
                source={{ uri: helpImageUri }}
              />
            </TouchableOpacity>
          )}
      </Fragment>
    );
  }
}
const RadioGridItem = withNamespaces()(Item);

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
    height: RADIO_BUTTON_HEIGHT / 2,
    width: RADIO_BUTTON_HEIGHT / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  helpIconButton: {
    alignItems: "center",
    height: RADIO_BUTTON_HEIGHT,
    justifyContent: "center",
    width: RADIO_BUTTON_HEIGHT,
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
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
  },
  radioRowButton: {
    borderColor: BORDER_COLOR,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: RADIO_BUTTON_HEIGHT,
  },
  radioRowButtonLast: {
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
