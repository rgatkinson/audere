// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import {
  BORDER_RADIUS,
  BORDER_WIDTH,
  GUTTER,
  SECONDARY_COLOR,
  THIN_BORDER_WIDTH,
} from "../styles";

interface Props {
  children?: any;
  style?: StyleProp<ViewStyle>;
}

export default class BorderView extends React.Component<Props> {
  render() {
    return (
      <View style={[styles.container, this.props.style]}>
        {this.props.children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    alignSelf: "stretch",
    borderColor: SECONDARY_COLOR,
    borderWidth: THIN_BORDER_WIDTH,
    marginBottom: GUTTER,
    padding: GUTTER / 2,
  },
});
