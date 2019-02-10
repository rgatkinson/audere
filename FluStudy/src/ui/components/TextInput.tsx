import React from "react";
import {
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  StyleProp,
  StyleSheet,
  TextInput as SystemTextInput,
  TextStyle,
} from "react-native";
import {
  BORDER_COLOR,
  FONT_NORMAL,
  GUTTER,
  PRIMARY_COLOR,
  REGULAR_TEXT,
} from "../styles";

interface Props {
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  autoFocus?: boolean;
  editable?: boolean;
  keyboardType?: KeyboardTypeOptions;
  placeholder: string;
  placeholderTextColor?: string;
  returnKeyType: ReturnKeyTypeOptions;
  style?: StyleProp<TextStyle>;
  value?: string | null;
  onChangeText(text: string): void;
  onSubmitEditing(): void;
}

export default class TextInput extends React.Component<Props> {
  textInput = React.createRef<SystemTextInput>();

  render() {
    return (
      <SystemTextInput
        autoCapitalize={this.props.autoCapitalize}
        autoCorrect={this.props.autoCorrect}
        autoFocus={this.props.autoFocus}
        editable={this.props.editable}
        keyboardType={
          !!this.props.keyboardType ? this.props.keyboardType : "default"
        }
        placeholder={this.props.placeholder}
        placeholderTextColor={this.props.placeholderTextColor}
        ref={this.textInput}
        returnKeyType={this.props.returnKeyType}
        style={[styles.textInput, this.props.style && this.props.style]}
        value={this.props.value !== null ? this.props.value : undefined}
        onChangeText={this.props.onChangeText}
        onSubmitEditing={() =>
          !!this.props.onSubmitEditing && this.props.onSubmitEditing()
        }
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
    color: PRIMARY_COLOR,
    borderBottomColor: BORDER_COLOR,
    borderBottomWidth: StyleSheet.hairlineWidth,
    fontFamily: FONT_NORMAL,
    fontSize: REGULAR_TEXT,
    padding: GUTTER / 4,
  },
});
