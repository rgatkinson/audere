// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet, View } from "react-native";

export default class ContentContainer extends React.Component {
  render() {
    return <View style={styles.contentContainer}>{this.props.children}</View>;
  }
}

const styles = StyleSheet.create({
  contentContainer: {
    alignItems: "center",
    marginHorizontal: 50,
    marginVertical: 20,
  },
});
