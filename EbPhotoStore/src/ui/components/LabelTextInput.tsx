// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { Fragment } from "react";
import {
  StyleProp,
  StyleSheet,
  TextStyle,
  ReturnKeyType,
  View,
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
  multiline?: boolean;
  numberOfLines?: number;
  placeholder: string;
  returnKeyType: ReturnKeyType;
  textStyle?: StyleProp<TextStyle>;
  textContent: string;
  onEndEditing?: (e: any) => void;
  onChangeText?(text: string): void;
  onKeyPress?: (e: any) => void;
  onSubmitEditing?: () => void;
}

interface State {
  isFocused: boolean;
}

export default class LabelTextInput extends React.Component<Props, State> {
  state: State = {
    isFocused: false,
  };

  textInput = React.createRef<TextInput>();

  _onFocus = () => {
    this.setState({ isFocused: true });
    console.log("on focus");
  };

  _onBlur = () => {
    this.setState({ isFocused: false });
  };

  render() {
    const {
      autoFocus,
      blurOnSubmit,
      focusedIndex,
      index,
      inputStyle,
      inputValue,
      multiline,
      numberOfLines,
      onChangeText,
      onEndEditing,
      onKeyPress,
      onSubmitEditing,
      placeholder,
      returnKeyType,
      textContent,
      textStyle,
    } = this.props;

    return (
      <Fragment>
        <Text
          content={textContent}
          style={[textStyle, this.state.isFocused && styles.highlightText]}
        />
        <TextInput
          autoFocus={autoFocus}
          blurOnSubmit={blurOnSubmit}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onBlur={this._onBlur}
          onChangeText={onChangeText}
          onEndEditing={onEndEditing}
          onFocus={this._onFocus}
          onKeyPress={onKeyPress}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          ref={this.textInput}
          returnKeyType={returnKeyType}
          style={[
            inputStyle,
            this.state.isFocused &&
              (multiline ? styles.multilineHighlight : styles.highlightInput),
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
    borderBottomWidth: 2,
  },
  highlightText: {
    color: HIGHLIGHT_COLOR,
  },
  multilineHighlight: {
    borderWidth: 2,
    borderBottomWidth: 2,
    borderColor: HIGHLIGHT_COLOR,
  },
});
