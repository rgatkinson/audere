import React from "react";
import { ReturnKeyTypeOptions, StyleSheet, View } from "react-native";
import KeyboardListener from "react-native-keyboard-listener";
import Text from "./Text";
import TextInput from "./TextInput";
import { ERROR_COLOR, FONT_NORMAL, GUTTER } from "../styles";

interface Props extends React.Props<EmailInput> {
  autoFocus: boolean;
  placeholder: string;
  returnKeyType: ReturnKeyTypeOptions;
  validationError: string;
  value?: string;
  onChange(email: string, valid: boolean): void;
  onSubmit?(valid: boolean): void;
}

interface State {
  email?: string;
  keyboardOpen: boolean;
}

export default class EmailInput extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      email: props.value,
      keyboardOpen: props.autoFocus,
    };
  }

  textInput = React.createRef<TextInput>();

  render() {
    return (
      <View style={styles.container}>
        <KeyboardListener
          onWillShow={() => {
            this.setState({ keyboardOpen: true });
          }}
          onWillHide={() => {
            this.setState({ keyboardOpen: false });
          }}
        />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={this.props.autoFocus}
          keyboardType="email-address"
          placeholder={this.props.placeholder}
          ref={this.textInput}
          returnKeyType={this.props.returnKeyType}
          value={this.state.email}
          onChangeText={(text: string) => {
            this.setState({ email: text });
            this.props.onChange(text, this._isValid());
          }}
          onSubmitEditing={() => {
            if (this.props.onSubmit != null) {
              this.props.onSubmit(this._isValid());
            }
          }}
        />
        <Text
          content={
            !!this.state.email && !this._isValid() && !this.state.keyboardOpen
              ? this.props.validationError
              : ""
          }
          style={styles.errorText}
        />
      </View>
    );
  }

  focus() {
    this.textInput.current!.focus();
  }

  _isValid = (): boolean => {
    // Top answer in https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
    const validationPattern = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    return (
      this.state.email != null && validationPattern.test(this.state.email!)
    );
  };
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    marginBottom: GUTTER,
  },
  errorText: {
    color: ERROR_COLOR,
    fontFamily: FONT_NORMAL,
  },
});
