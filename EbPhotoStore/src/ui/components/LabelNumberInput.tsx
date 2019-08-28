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
  KeyboardType,
} from "react-native";
import Text from "./Text";
import NumberInput from "./NumberInput";
import { HIGHLIGHT_COLOR } from "../styles";

interface Props {
  autoFocus?: boolean;
  blurOnSubmit?: boolean;
  focusedIndex?: number;
  inputStyle?: StyleProp<TextStyle>;
  inputValue?: string;
  index?: number;
  keyboardType?: KeyboardType;
  multiline?: boolean;
  numberOfLines?: number;
  placeholder: string;
  returnKeyType: ReturnKeyType;
  textStyle?: StyleProp<TextStyle>;
  textContent: string;
  onEndEditing?: (e: any) => void;
  onChangeText(text: string): void;
  onKeyPress?: (e: any) => void;
  onSubmitEditing?: () => void;
}

interface State {
  isFocused: boolean;
}

export default class LabelNumberInput extends React.Component<Props, State> {
  state: State = {
    isFocused: false,
  };

  textInput = React.createRef<NumberInput>();

  _onFocus = () => {
    this.setState({ isFocused: true });
  };

  _onBlur = () => {
    this.setState({ isFocused: false });
  };

  render() {
    const {
      autoFocus,
      inputStyle,
      inputValue,
      keyboardType,
      onChangeText,
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

        <NumberInput
          autoFocus={autoFocus}
          containerStyle={[
            inputStyle,
            this.state.isFocused && styles.highlightInput,
          ]}
          keyboardType={keyboardType}
          onBlur={this._onBlur}
          onChangeText={onChangeText}
          onFocus={this._onFocus}
          onKeyPress={onKeyPress}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          ref={this.textInput}
          returnKeyType={returnKeyType}
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
    borderColor: HIGHLIGHT_COLOR,
  },
});
