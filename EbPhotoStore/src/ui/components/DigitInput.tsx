// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet, View } from "react-native";
import NumberInput from "./NumberInput";
import { EXTRA_LARGE_TEXT } from "../styles";

interface Props {
  digits: number;
  onSubmitEditing: (text: string) => void;
}

export default class DigitInput extends React.Component<Props> {
  inputRefs: React.RefObject<any>[];

  constructor(props: Props) {
    super(props);
    this.inputRefs = new Array(props.digits);
    for (let i = 0; i < props.digits; i++) {
      this.inputRefs[i] = React.createRef<any>();
    }
  }

  state = {
    digits: new Array(this.props.digits),
  };

  _getNumberInput = (index: number) => {
    return (
      <NumberInput
        autoFocus={index == 0}
        containerStyle={styles.textContainerStyle}
        maxDigits={1}
        key={"digitInput" + index}
        placeholder="-"
        placeholderTextColor="black"
        ref={this.inputRefs[index]}
        returnKeyType={index == this.props.digits - 1 ? "done" : "next"}
        textStyle={styles.textStyle}
        onKeyPress={(e: any) => {
          if (e.nativeEvent.key == "Backspace") {
            if (index > 0) {
              this.inputRefs[index - 1].current!.focus();
            }
          }
        }}
        onChangeText={(digit: string) => {
          const newDigits = this.state.digits.slice(0);
          newDigits[index] = digit;
          this.setState({ digits: newDigits });
          const text = newDigits.join("");
          if (/^[0-9]*$/.test(text) && text.length == this.props.digits) {
            this.props.onSubmitEditing(text);
          } else if (index < this.props.digits - 1 && /^[0-9]$/.test(digit)) {
            this.inputRefs[index + 1].current!.focus();
          }
        }}
      />
    );
  };

  _getNumberInputs() {
    const inputs = new Array(this.props.digits);
    for (let index = 0; index < this.props.digits; index++) {
      inputs[index] = this._getNumberInput(index);
    }
    return inputs;
  }

  render() {
    return <View style={styles.container}>{this._getNumberInputs()}</View>;
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    alignItems: "center",
    flexDirection: "row",
  },
  textContainerStyle: {
    borderBottomWidth: 0,
    flex: 1,
  },
  textStyle: {
    fontSize: EXTRA_LARGE_TEXT,
    textAlign: "center",
  },
});
