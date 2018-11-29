import React from "react";
import {
  ReturnKeyTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface Props {
  autoFocus?: boolean;
  placeholder: string;
  returnKeyType: ReturnKeyTypeOptions;
  value?: string;
  onChange(text: string): void;
  onSubmit(): void;
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
        style={styles.textInput}
        ref={this.textInput}
        returnKeyType={this.props.returnKeyType}
        value={this.props.value}
        onChangeText={this.props.onChange}
        onSubmitEditing={this.props.onSubmit}
      />
    );
  }

  focus() {
    this.textInput.current!.focus();
  }
}

const styles = StyleSheet.create({
  textInput: {
    alignSelf: "stretch",
    borderBottomColor: "#bbb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    fontFamily: "OpenSans-Regular",
    fontSize: 20,
    height: 30,
    marginVertical: 20,
    paddingHorizontal: 16,
  },
});
