import React from "react";
import { ReturnKeyTypeOptions } from "react-native";
import TextInput from "./TextInput";

interface Props {
  autoFocus?: boolean;
  placeholder: string;
  returnKeyType: ReturnKeyTypeOptions;
  value?: string;
  onChange(text: string): void;
}

export default class NumberInput extends React.Component<Props> {
  // TODO: accept a min max and validate that input value is valid
  // TODO: accept a required prop and show error if required and not entered
  render() {
    return (
      <TextInput
        autoFocus={this.props.autoFocus}
        keyboardType="numeric"
        placeholder={this.props.placeholder}
        returnKeyType={this.props.returnKeyType}
        value={this.props.value}
        onChangeText={this.props.onChange}
      />
    );
  }
}
