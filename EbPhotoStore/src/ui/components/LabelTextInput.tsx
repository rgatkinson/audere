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
  View
} from "react-native";
import Text from "./Text";
import TextInput from "./TextInput";
import { HIGHLIGHT_COLOR } from "../styles";

interface Props {
  autoFocus?: boolean;
  blurOnSubmit?: boolean;
  focusedIndex?: number;
  inputStyle?: StyleProp<TextStyle>;
  inputValue?: string;
  index?: number;
  innerRef?: React.RefObject<TextInput>;
  multiline?: boolean;
  numberOfLines?: number;
  placeholder: string;
  returnKeyType: ReturnKeyType;
  textStyle?: StyleProp<TextStyle>;
  textContent: string;
  onBlur?: () => void;
  onEndEditing?: (e: any) => void;
  onChangeText?(text: string): void;
  onFocus?: (key: number) => void;
  onKeyPress?: (e: any) => void;
  onSubmitEditing?: () => void;
}

export default class LabelTextInput extends React.Component<Props> {
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
      blurOnSubmit,
      focusedIndex,
      index,
      innerRef,
      inputStyle,
      inputValue,
      multiline,
      numberOfLines,
      onBlur,
      onChangeText,
      onEndEditing,
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
        <TextInput
          autoFocus={autoFocus}
          blurOnSubmit={blurOnSubmit}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onBlur={onBlur}
          onChangeText={onChangeText}
          onEndEditing={onEndEditing}
          onFocus={this._onFocus}
          onKeyPress={onKeyPress}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          ref={innerRef}
          returnKeyType={returnKeyType}
          style={[
            inputStyle,
            highlighted &&
              (multiline ? styles.multilineHighlight : styles.highlightInput)
          ]}
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
    borderBottomWidth: 2,
    borderColor: HIGHLIGHT_COLOR
  }
});
