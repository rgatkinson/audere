// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { View, ViewStyle, StyleProp, StyleSheet } from "react-native";
import { BORDER_COLOR, GUTTER } from "../styles";

interface Props {
  style?: StyleProp<ViewStyle>;
}

export default class Divider extends React.Component<Props> {
  render() {
    return <View style={[styles.container, this.props.style]} />;
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    borderBottomColor: BORDER_COLOR,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: GUTTER,
  },
});
