import React from "react";
import { ReturnKeyTypeOptions, StyleProp, TextStyle } from "react-native";
import TextInput from "./TextInput";

interface Props {
  autoFocus?: boolean;
  placeholder: string;
  returnKeyType: ReturnKeyTypeOptions;
  style?: StyleProp<TextStyle>;
  value?: string;
  onChangeText(text: string): void;
  onSubmitEditing(): void;
}

export default class NumberInput extends React.Component<Props> {
  textInput = React.createRef<TextInput>();

  // TODO: accept a min max and validate that input value is valid
  // TODO: accept a required prop and show error if required and not entered
  render() {
    return (
      <TextInput
        autoFocus={this.props.autoFocus}
        keyboardType="numbers-and-punctuation"
        placeholder={this.props.placeholder}
        ref={this.textInput}
        returnKeyType={this.props.returnKeyType}
        style={this.props.style}
        value={this.props.value}
        onChangeText={this.props.onChangeText}
        onSubmitEditing={this.props.onSubmitEditing}
      />
    );
  }

  focus() {
    this.textInput.current!.focus();
  }
}
