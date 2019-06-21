// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Text, View, StyleSheet } from "react-native";

interface Props {
  item: string;
  value: string;
}

export default class KeyValueLine extends React.Component<Props> {
  render() {
    return (
      <View style={styles.keyValueLine}>
        <Text style={styles.itemText}>{this.props.item}</Text>
        <Text style={styles.valueText}>{this.props.value}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  itemText: {
    fontSize: 18,
    fontWeight: "500",
    marginLeft: 10,
  },
  valueText: {
    fontSize: 18,
    marginRight: 20,
    color: "#444",
  },
  keyValueLine: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f9fafa",
    padding: 10,
    marginTop: 35,
    opacity: 0.75,
    width: "100%",
    marginVertical: 2,
  },
});
