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
import { NavigationScreenProp, withNavigationFocus } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { Action, updateAnswer } from "../../store";
import { SurveyQuestion } from "../../resources/QuestionConfig";
import {
  BORDER_WIDTH,
  BUTTON_BORDER_RADIUS,
  GUTTER,
  HIGHLIGHT_STYLE,
  RADIO_BUTTON_HEIGHT,
  SECONDARY_COLOR,
  TEXT_COLOR,
} from "../styles";
import Text from "./Text";

interface Props {
  highlighted?: boolean;
  isFocused: boolean;
  navigation: NavigationScreenProp<any, any>;
  question: SurveyQuestion;
  getAnswer(key: string, id: string): any;
  dispatch(action: Action): void;
}

interface State {
  selected: string | undefined;
}

class ButtonGrid extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      selected: props.getAnswer("selectedButtonKey", props.question.id),
    };
  }

  shouldComponentUpdate(props: Props) {
    return props.isFocused;
  }

  _onPress = (buttonKey: string) => {
    const selected = this.state.selected === buttonKey ? undefined : buttonKey;
    this.setState({ selected });
    this.props.dispatch(
      updateAnswer({ selectedButtonKey: selected }, this.props.question)
    );
  };

  render() {
    const { highlighted, question } = this.props;
    return (
      <View
        style={[
          styles.container,
          question.buttons.length < 3 && { width: "67%" },
        ]}
      >
        {question.buttons.map((button, index) => (
          <ButtonGridItem
            buttonKey={button.key}
            first={index === 0}
            key={button.key}
            highlighted={!!highlighted}
            last={index === question.buttons.length - 1}
            selected={this.state.selected === button.key}
            onPress={this._onPress}
          />
        ))}
      </View>
    );
  }
}
export default connect()(withNavigationFocus(ButtonGrid));

interface ItemProps {
  buttonKey: string;
  first: boolean;
  highlighted: boolean;
  last: boolean;
  selected: boolean;
  onPress: (key: string) => void;
}

class Item extends React.Component<ItemProps & WithNamespaces> {
  shouldComponentUpdate(props: ItemProps & WithNamespaces) {
    return (
      props.selected != this.props.selected ||
      props.highlighted != this.props.highlighted
    );
  }

  _onPress = () => {
    this.props.onPress(this.props.buttonKey);
  };

  render() {
    const { buttonKey, first, highlighted, last, selected, t } = this.props;
    return (
      <TouchableOpacity
        onPress={this._onPress}
        style={[
          styles.button,
          first && styles.buttonFirst,
          last && styles.buttonLast,
          selected && styles.selectedButton,
          !!highlighted && HIGHLIGHT_STYLE,
        ]}
      >
        <Text
          bold={true}
          center={true}
          content={t("surveyButton:" + buttonKey)}
          style={[styles.buttonText, selected && styles.selectedButtonText]}
        />
      </TouchableOpacity>
    );
  }
}

const ButtonGridItem = withNamespaces()(Item);

const styles = StyleSheet.create({
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
    flexDirection: "row",
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
