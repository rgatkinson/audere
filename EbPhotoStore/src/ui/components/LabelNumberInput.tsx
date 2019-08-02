// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { Fragment } from "react";
import {
  StyleProp,
  StyleSheet,
  TextInput as SystemTextInput,
  TextStyle,
  ReturnKeyType,
  KeyboardType
} from "react-native";
import Text from "./Text";
import NumberInput from "./NumberInput";
import { HIGHLIGHT_COLOR } from "../styles";
import TextInput from "./TextInput";

interface Props {
  autoFocus?: boolean;
  blurOnSubmit?: boolean;
  focusedIndex?: number;
  inputStyle?: StyleProp<TextStyle>;
  inputValue?: string;
  index?: number;
  innerRef?: React.RefObject<TextInput>;
  keyboardType?: KeyboardType;
  multiline?: boolean;
  numberOfLines?: number;
  placeholder: string;
  returnKeyType: ReturnKeyType;
  textStyle?: StyleProp<TextStyle>;
  textContent: string;
  onBlur?: () => void;
  onEndEditing?: (e: any) => void;
  onChangeText(text: string): void;
  onFocus?: (key: number) => void;
  onKeyPress?: (e: any) => void;
  onSubmitEditing?: () => void;
}

export default class LabelNumberInput extends React.Component<Props> {
  textInput = React.createRef<SystemTextInput>();

  _onFocus = () => {
    const { index, onFocus } = this.props;
    if (index != undefined && onFocus != undefined) {
      onFocus(index);
    }
  };

  render() {
    const {
      autoFocus,
      focusedIndex,
      index,
      inputStyle,
      inputValue,
      innerRef,
      keyboardType,
      onChangeText,
      onBlur,
      onKeyPress,
      onSubmitEditing,
      placeholder,
      returnKeyType,
      textContent,
      textStyle
    } = this.props;

    const highlighted = focusedIndex === index;

    return (
      <Fragment>
        <Text
          content={textContent}
          style={[textStyle, highlighted && styles.highlightText]}
        />
        <NumberInput
          autoFocus={autoFocus}
          keyboardType={keyboardType}
          onBlur={onBlur}
          onChangeText={onChangeText}
          onFocus={this._onFocus}
          onKeyPress={onKeyPress}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          innerRef={innerRef}
          returnKeyType={returnKeyType}
          style={[inputStyle, highlighted && styles.highlightInput]}
          value={inputValue}
        />
      </Fragment>
    );
  }

  focus() {
    this.textInput.current!.focus();
  }
}

const styles = StyleSheet.create({
  highlightInput: {
    borderBottomColor: HIGHLIGHT_COLOR,
    borderBottomWidth: 2
  },
  highlightText: {
    color: HIGHLIGHT_COLOR
  },
  multilineHighlight: {
    borderWidth: 2,
    borderColor: HIGHLIGHT_COLOR
  }
});
