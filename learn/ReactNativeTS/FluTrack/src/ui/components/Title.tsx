// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Text from "./Text";

interface Props {
  label: string;
  size?: "large" | "small";
  style?: StyleProp<ViewStyle>;
}

export default class Title extends React.Component<Props> {
  render() {
    return (
      <Text
        center={true}
        content={this.props.label}
        extraBold={true}
        style={[
          styles.title,
          this.props.size && this.props.size == "large" && styles.large,
          this.props.size && this.props.size == "small" && styles.small,
          this.props.style && this.props.style,
        ]}
      />
    );
  }
}

const styles = StyleSheet.create({
  small: {
    fontSize: 33,
    letterSpacing: 0.16,
    lineHeight: 40,
  },
  large: {
    fontSize: 63,
    letterSpacing: 0.74,
    lineHeight: 83,
  },
  title: {
    color: "#4B2E83",
    fontFamily: "OpenSans-SemiBold",
    fontSize: 49,
    letterSpacing: 0.24,
    lineHeight: 58,
  },
});
