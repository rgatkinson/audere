// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { ReturnKeyTypeOptions, StyleProp, TextStyle } from "react-native";
import TextInput from "./TextInput";

interface Props {
  autoFocus?: boolean;
  maxDigits: number;
  placeholder: string;
  placeholderTextColor?: string;
  returnKeyType: ReturnKeyTypeOptions;
  style?: StyleProp<TextStyle>;
  value?: string;
  onChangeText(text: string): void;
  onKeyPress?: (e: any) => void;
  onSubmitEditing?: () => void;
}

interface State {
  text?: string;
}

export default class NumberInput extends React.Component<Props, State> {
  textInput = React.createRef<TextInput>();

  constructor(props: Props) {
    super(props);
    this.state = {
      text: props.value,
    };
  }

  onChangeText = (text: string) => {
    const numbers = "0123456789";
    const newText = text
      .replace(/[^0-9]/g, "")
      .substring(0, this.props.maxDigits);
    this.setState({ text: newText });
    this.props.onChangeText(newText);
  };

  render() {
    return (
      <TextInput
        autoCorrect={false}
        autoFocus={this.props.autoFocus}
        keyboardType={"number-pad"}
        placeholder={this.props.placeholder}
        placeholderTextColor={this.props.placeholderTextColor}
        ref={this.textInput}
        returnKeyType={this.props.returnKeyType}
        style={this.props.style}
        value={this.state.text}
        onChangeText={this.onChangeText}
        onKeyPress={this.props.onKeyPress}
        onSubmitEditing={this.props.onSubmitEditing}
      />
    );
  }

  focus() {
    this.textInput.current!.focus();
  }
}
