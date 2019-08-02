// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle
} from "react-native";
import {
  BUTTON_BORDER_RADIUS,
  BORDER_WIDTH,
  BUTTON_WIDTH,
  BUTTON_WIDTH_SM,
  EXTRA_SMALL_TEXT,
  FONT_ROBO_BOLD,
  GUTTER,
  HIGHLIGHT_COLOR,
  INPUT_HEIGHT,
  INPUT_HEIGHT_SM,
  INPUT_TEXT,
  REGULAR_TEXT
} from "../styles";

interface Props {
  enabled: boolean;
  fontSize?: number;
  primary: boolean;
  label: string;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  onPress?(event: GestureResponderEvent): void;
}

export default class Button extends React.Component<Props> {
  handlePress = (event: GestureResponderEvent) => {
    this.props.enabled &&
      this.props.onPress != null &&
      this.props.onPress(event);
  };

  render() {
    const {
      enabled,
      fontSize,
      label,
      primary,
      small,
      style,
      textStyle
    } = this.props;
    return (
      <TouchableOpacity
        disabled={!enabled}
        style={[
          styles.button,
          !!small && styles.buttonSm,
          { opacity: enabled ? 0.95 : 0.5 },
          primary && styles.primaryButton,
          style && style
        ]}
        onPress={this.handlePress}
      >
        <Text
          style={[
            styles.text,
            !small && styles.textMed,
            !!small && styles.textSm,
            primary ? styles.primaryButtonText : styles.secondaryButtonText,
            !!fontSize && { fontSize },
            textStyle && textStyle
          ]}
          accessibilityLabel={label.toUpperCase()}
        >
          {label.toUpperCase()}
        </Text>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderColor: HIGHLIGHT_COLOR,
    flexDirection: "row",
    justifyContent: "center",
    borderRadius: BUTTON_BORDER_RADIUS,
    borderWidth: BORDER_WIDTH,
    height: INPUT_HEIGHT,
    marginBottom: GUTTER * 2,
    width: BUTTON_WIDTH
  },
  buttonSm: {
    borderRadius: BUTTON_BORDER_RADIUS,
    height: INPUT_HEIGHT_SM,
    marginBottom: GUTTER,
    width: BUTTON_WIDTH_SM
  },
  check: {
    paddingRight: GUTTER / 2
  },
  text: {
    color: "#fff",
    fontFamily: FONT_ROBO_BOLD,
    fontSize: REGULAR_TEXT,
    fontWeight: "bold",
    lineHeight: INPUT_HEIGHT,
    textAlign: "center",
    textAlignVertical: "center"
  },
  textMed: {
    fontSize: INPUT_TEXT
  },
  textSm: {
    fontSize: EXTRA_SMALL_TEXT
  },
  primaryButton: {
    backgroundColor: HIGHLIGHT_COLOR
  },
  primaryButtonText: {
    color: "white"
  },
  secondaryButtonText: {
    color: HIGHLIGHT_COLOR
  }
});
