// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  Image,
  ImageSourcePropType,
  Keyboard,
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  StyleProp,
  StyleSheet,
  TextInput as SystemTextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import {
  BORDER_COLOR,
  FONT_NORMAL,
  GUTTER,
  ICON_SIZE,
  REGULAR_TEXT,
  TEXT_COLOR,
} from "../styles";

interface Props {
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  autoFocus?: boolean;
  blurOnSubmit?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  editable?: boolean;
  icon?: ImageSourcePropType;
  keyboardType?: KeyboardTypeOptions;
  placeholder: string;
  placeholderTextColor?: string;
  multiline?: boolean;
  numberOfLines?: number;
  returnKeyType: ReturnKeyTypeOptions;
  textStyle?: StyleProp<TextStyle>;
  value?: string | null;
  onBlur?: () => void;
  onEndEditing?: (e: any) => void;
  onChangeText?(text: string): void;
  onIconPress?(): void;
  onFocus?: () => void;
  onKeyPress?: (e: any) => void;
  onSubmitEditing?: () => void;
}

export default class TextInput extends React.Component<Props> {
  textInput = React.createRef<SystemTextInput>();

  _onSubmitEditing = () => {
    !!this.props.onSubmitEditing && this.props.onSubmitEditing();
  };

  _onIconPress = () => {
    const { onIconPress } = this.props;
    Keyboard.dismiss();
    !!onIconPress && onIconPress();
  };

  render() {
    return (
      <View
        style={[
          styles.container,
          this.props.multiline ? styles.inputMulti : styles.inputSingle,
          this.props.containerStyle,
        ]}
      >
        <SystemTextInput
          selectTextOnFocus
          autoCapitalize={this.props.autoCapitalize}
          autoCorrect={this.props.autoCorrect}
          autoFocus={this.props.autoFocus}
          blurOnSubmit={this.props.blurOnSubmit}
          editable={this.props.editable}
          keyboardType={this.props.keyboardType && this.props.keyboardType}
          onBlur={this.props.onBlur}
          onEndEditing={this.props.onEndEditing}
          onFocus={this.props.onFocus}
          multiline={this.props.multiline}
          numberOfLines={this.props.numberOfLines}
          placeholder={this.props.placeholder}
          placeholderTextColor={this.props.placeholderTextColor}
          ref={this.textInput}
          returnKeyType={this.props.returnKeyType}
          style={[styles.textInput, this.props.textStyle]}
          textAlignVertical="top"
          value={this.props.value !== null ? this.props.value : undefined}
          onChangeText={this.props.onChangeText}
          onKeyPress={this.props.onKeyPress}
          onSubmitEditing={this._onSubmitEditing}
          accessibilityLabel={this.props.placeholder}
        />
        {!!this.props.icon && (
          <TouchableOpacity
            onPress={this._onIconPress}
            style={styles.iconContainer}
          >
            <Image source={this.props.icon} style={styles.icon} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  focus() {
    this.textInput.current!.focus();
  }
}

const styles = StyleSheet.create({
  container: {
    borderColor: BORDER_COLOR,
    flexDirection: "row",
  },
  icon: {
    height: ICON_SIZE,
    width: ICON_SIZE,
  },
  iconContainer: {
    justifyContent: "flex-end",
  },
  textInput: {
    alignSelf: "stretch",
    color: TEXT_COLOR,
    flex: 1,
    fontFamily: FONT_NORMAL,
    fontSize: REGULAR_TEXT,
    padding: 0,
  },
  inputMulti: {
    borderWidth: 1,
    marginBottom: GUTTER,
    padding: GUTTER / 2,
  },
  inputSingle: {
    borderBottomWidth: 1,
  },
});
