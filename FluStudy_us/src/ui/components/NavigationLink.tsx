// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { GUTTER, LARGE_TEXT, EXTRA_LARGE_TEXT } from "../styles";
import Text from "./Text";

interface Props {
  enabled: boolean;
  label: string;
  onPress?(event: GestureResponderEvent): void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

class NavigationLink extends React.Component<Props> {
  shouldComponentUpdate(props: Props) {
    return props.label != this.props.label;
  }

  render() {
    const { enabled, label, onPress, style, textStyle } = this.props;
    return (
      <TouchableOpacity
        disabled={!enabled}
        style={[
          styles.container,
          { opacity: enabled ? 0.95 : 0.5 },
          style && style,
        ]}
        onPress={onPress}
      >
        <Text content={label} style={[styles.text, textStyle && textStyle]} />
        <Feather
          name="arrow-right"
          size={EXTRA_LARGE_TEXT}
          style={[styles.arrow, textStyle && textStyle]}
        />
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginTop: GUTTER / 2,
    marginBottom: GUTTER,
    alignContent: "center",
  },
  text: {
    fontSize: LARGE_TEXT,
    marginTop: GUTTER / 8,
  },
  arrow: {
    marginLeft: GUTTER / 4,
  },
});

export default NavigationLink;
