// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import NumberSelectorModal from "./NumberSelectorModal";

interface Props {
  min: number;
  max: number;
  maxPlus: boolean;
  num?: number;
  placeholder: string;
  onNumChange(num?: number): void;
}

export default class NumberSelectorInput extends React.Component<Props> {
  state = {
    open: false,
  };

  render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.textContainer}
          onPress={() => this.setState({ open: true })}
        >
          {this.props.num != null ? (
            <Text style={styles.text}>{this.props.num}</Text>
          ) : (
            <Text style={styles.text}>{this.props.placeholder}</Text>
          )}
        </TouchableOpacity>
        <NumberSelectorModal
          min={this.props.min}
          max={this.props.max}
          maxPlus={this.props.maxPlus}
          num={this.props.num}
          visible={this.state.open}
          onDismiss={num => {
            this.setState({ open: false });
            this.props.onNumChange(num);
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 30,
    marginVertical: 20,
  },
  textContainer: {
    alignSelf: "stretch",
    borderBottomColor: "#bbb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 30,
  },
  text: {
    color: "#007AFF",
    fontFamily: "OpenSans-Regular",
    fontSize: 17,
    paddingHorizontal: 16,
    letterSpacing: -0.41,
    lineHeight: 22,
  },
});
