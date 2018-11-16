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
  value?: string | null;
  onChange?(text: string): void;
  onSubmit?(): void;
}

export default class TextInput extends React.Component<Props> {
  textInput = React.createRef<SystemTextInput>();

  render() {
    return (
      <SystemTextInput
        autoFocus={this.props.autoFocus}
        placeholder={this.props.placeholder}
        style={styles.textInput}
        ref={this.textInput}
        returnKeyType={this.props.returnKeyType}
        value={this.props.value ? this.props.value : undefined}
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
    fontSize: 20,
    height: 30,
    marginVertical: 20,
    paddingHorizontal: 16,
  },
});
