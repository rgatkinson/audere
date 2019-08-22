// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleProp, StyleSheet, TextStyle, ViewStyle } from "react-native";
import Text from "./Text";
import {
  EXTRA_LARGE_TEXT,
  FONT_COLOR,
  FONT_ROBO_LIGHT,
  GUTTER,
  LINE_HEIGHT_DIFFERENCE,
} from "../styles";

interface Props {
  label: string;
  style?: StyleProp<TextStyle | ViewStyle>;
}

export default class Title extends React.Component<Props> {
  render() {
    return (
      <Text
        content={this.props.label}
        style={[styles.title, this.props.style]}
      />
    );
  }
}

const styles = StyleSheet.create({
  title: {
    color: FONT_COLOR,
    fontFamily: FONT_ROBO_LIGHT,
    fontSize: EXTRA_LARGE_TEXT,
    lineHeight: EXTRA_LARGE_TEXT + LINE_HEIGHT_DIFFERENCE,
  },
});
