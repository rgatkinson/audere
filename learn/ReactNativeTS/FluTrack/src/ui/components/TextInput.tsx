import React from "react";
import {
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  StyleProp,
  StyleSheet,
  TextInput as SystemTextInput,
  TextStyle,
} from "react-native";

interface Props {
  autoFocus?: boolean;
  keyboardType?: KeyboardTypeOptions;
  placeholder: string;
  returnKeyType: ReturnKeyTypeOptions;
  style?: StyleProp<TextStyle>;
  value?: string | null;
  onChangeText(text: string): void;
}

export default class TextInput extends React.Component<Props> {
  render() {
    return (
      <SystemTextInput
        autoFocus={this.props.autoFocus}
        keyboardType={!!this.props.keyboardType ? this.props.keyboardType : "default"}
        placeholder={this.props.placeholder}
        returnKeyType={this.props.returnKeyType}
        style={[styles.textInput, this.props.style && this.props.style]}
        value={this.props.value !== null ? this.props.value : undefined}
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
