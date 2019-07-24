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
  BORDER_RADIUS,
  BORDER_WIDTH,
  BUTTON_WIDTH,
  FONT_SEMI_BOLD,
  GUTTER,
  INPUT_HEIGHT,
  INPUT_TEXT,
  PRIMARY_COLOR
} from "../styles";

interface Props {
  enabled: boolean;
  fontSize?: number;
  primary: boolean;
  label: string;
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
    const { enabled, fontSize, label, primary, style, textStyle } = this.props;
    return (
      <TouchableOpacity
        disabled={!enabled}
        style={[
          styles.button,
          { opacity: enabled ? 0.95 : 0.5 },
          primary && styles.primaryButton,
          style && style
        ]}
        onPress={this.handlePress}
      >
        <Text
          style={[
            styles.text,
            primary ? styles.primaryButtonText : styles.secondaryButtonText,
            !!fontSize && { fontSize: fontSize },
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
    borderColor: PRIMARY_COLOR,
    borderRadius: BORDER_RADIUS,
    borderWidth: BORDER_WIDTH,
    flexDirection: "row",
    height: INPUT_HEIGHT,
    justifyContent: "center",
    marginBottom: GUTTER * 2,
    width: BUTTON_WIDTH
  },
  check: {
    paddingRight: GUTTER / 2
  },
  text: {
    fontFamily: FONT_SEMI_BOLD,
    fontSize: INPUT_TEXT,
    textAlign: "center"
  },
  primaryButton: {
    backgroundColor: PRIMARY_COLOR
  },
  primaryButtonText: {
    color: "white"
  },
  secondaryButtonText: {
    color: PRIMARY_COLOR
  }
});
