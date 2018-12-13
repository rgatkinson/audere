import React from "react";
import {
  ReturnKeyTypeOptions,
  StyleSheet,
  Text,
  TextInput as SystemTextInput,
  View,
} from "react-native";

interface Props {
  autoFocus?: boolean;
  placeholder: string;
  returnKeyType: ReturnKeyTypeOptions;
  value: string | null;
  onChangeText(text: string): void;
}

export default class TextInput extends React.Component<Props> {
  render() {
    return (
      <SystemTextInput
        autoFocus={this.props.autoFocus}
        placeholder={this.props.placeholder}
        returnKeyType={this.props.returnKeyType}
        style={styles.textInput}
        value={this.props.value ? this.props.value : undefined}
        onChangeText={this.props.onChangeText}
      />
    );
  }
}

const styles = StyleSheet.create({
  textInput: {
    alignSelf: "stretch",
    borderBottomColor: "#bbb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    fontSize: 20,
    height: 30,
    marginVertical: 20,
    paddingHorizontal: 16,
  },
});
