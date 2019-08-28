// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { Fragment } from "react";
import {
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  TextStyle,
  ReturnKeyType,
  ViewStyle,
} from "react-native";
import Text from "./Text";
import TextInput from "./TextInput";
import { HIGHLIGHT_COLOR } from "../styles";

interface Props {
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoFocus?: boolean;
  blurOnSubmit?: boolean;
  icon?: ImageSourcePropType;
  inputStyle?: StyleProp<ViewStyle>;
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
  onIconPress?(): void;
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
  };

  _onBlur = () => {
    this.setState({ isFocused: false });
  };

  render() {
    const {
      autoCapitalize,
      autoFocus,
      blurOnSubmit,
      icon,
      inputStyle,
      inputValue,
      multiline,
      numberOfLines,
      onChangeText,
      onEndEditing,
      onIconPress,
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
          autoCapitalize={autoCapitalize}
          autoFocus={autoFocus}
          blurOnSubmit={blurOnSubmit}
          containerStyle={[
            inputStyle,
            this.state.isFocused &&
              (multiline ? styles.multilineHighlight : styles.highlightInput),
          ]}
          icon={icon}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onBlur={this._onBlur}
          onChangeText={onChangeText}
          onEndEditing={onEndEditing}
          onFocus={this._onFocus}
          onIconPress={onIconPress}
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
    borderBottomWidth: 2,
    borderColor: HIGHLIGHT_COLOR,
  },
});
