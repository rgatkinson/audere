// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { View, ViewStyle, StyleProp, StyleSheet } from "react-native";
import { BORDER_WIDTH, PRIMARY_COLOR, GUTTER } from "../styles";
import Text from "./Text";

interface Props {
  num: number;
  style?: StyleProp<ViewStyle>;
}

export default class Number extends React.PureComponent<Props> {
  render() {
    return (
      <View style={[styles.container, this.props.style]}>
        <Text
          bold={true}
          content={this.props.num.toString()}
          style={{ color: PRIMARY_COLOR }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderColor: PRIMARY_COLOR,
    borderRadius: 2,
    borderWidth: BORDER_WIDTH,
    justifyContent: "center",
    marginRight: GUTTER,
    marginVertical: GUTTER / 2,
    width: 30,
    height: 30,
  },
});
