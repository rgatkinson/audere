// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleProp, StyleSheet, TextStyle, ViewStyle } from "react-native";
import Text from "./Text";
import {
  FONT_COLOR_LIGHT,
  FONT_ROBO_LIGHT,
  GUTTER,
  LINE_HEIGHT_DIFFERENCE,
  TITLE_TEXT,
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
    color: FONT_COLOR_LIGHT,
    fontFamily: FONT_ROBO_LIGHT,
    fontSize: TITLE_TEXT,
    lineHeight: TITLE_TEXT + LINE_HEIGHT_DIFFERENCE,
    marginBottom: GUTTER,
    marginTop: GUTTER / 2,
  },
});
