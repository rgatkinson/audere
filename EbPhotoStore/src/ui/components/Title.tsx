// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleProp, StyleSheet, TextStyle, ViewStyle } from "react-native";
import Text from "./Text";
import {
  FONT_NORMAL,
  GUTTER,
  PRIMARY_COLOR,
  LARGE_TEXT,
  LINE_HEIGHT_DIFFERENCE
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
    color: PRIMARY_COLOR,
    fontFamily: FONT_NORMAL,
    fontSize: LARGE_TEXT,
    fontWeight: "bold",
    lineHeight: LARGE_TEXT + LINE_HEIGHT_DIFFERENCE,
    marginTop: GUTTER / 2,
    marginBottom: GUTTER
  }
});
