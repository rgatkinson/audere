// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

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
  REGULAR_TEXT,
  TEXT_COLOR,
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
  onEndEditing?: (e: any) => void;
  onChangeText?(text: string): void;
  onFocus?: () => void;
  onKeyPress?: (e: any) => void;
  onSubmitEditing?: () => void;
}

export default class TextInput extends React.Component<Props> {
  textInput = React.createRef<SystemTextInput>();

  render() {
    return (
      <SystemTextInput
        selectTextOnFocus
        autoCapitalize={this.props.autoCapitalize}
        autoCorrect={this.props.autoCorrect}
        autoFocus={this.props.autoFocus}
        editable={this.props.editable}
        keyboardType={
          !!this.props.keyboardType ? this.props.keyboardType : "default"
        }
        onEndEditing={this.props.onEndEditing}
        onFocus={this.props.onFocus}
        placeholder={this.props.placeholder}
        placeholderTextColor={this.props.placeholderTextColor}
        ref={this.textInput}
        returnKeyType={this.props.returnKeyType}
        style={[styles.textInput, this.props.style && this.props.style]}
        value={this.props.value !== null ? this.props.value : undefined}
        onChangeText={this.props.onChangeText}
        onKeyPress={this.props.onKeyPress}
        onSubmitEditing={() =>
          !!this.props.onSubmitEditing && this.props.onSubmitEditing()
        }
        accessibilityLabel={this.props.placeholder}
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
    color: TEXT_COLOR,
    borderBottomColor: BORDER_COLOR,
    borderBottomWidth: StyleSheet.hairlineWidth,
    fontFamily: FONT_NORMAL,
    fontSize: REGULAR_TEXT,
    padding: GUTTER / 4,
  },
});
