import React from "react";
import { ReturnKeyTypeOptions, StyleSheet, Text, View } from "react-native";
import KeyboardListener from "react-native-keyboard-listener";
import TextInput from "./TextInput";

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
          style={styles.input}
          value={this.state.email}
          onChangeText={(text: string) => {
            this.setState({ email: text });
            this.props.onChange(text, this._isValid(text));
          }}
          onSubmitEditing={() => {
            if (this.props.onSubmit != null) {
              this.props.onSubmit(this._isValid(this.state.email));
            }
          }}
        />
        <Text style={styles.errorText}>
          {!!this.state.email &&
          !this._isValid(this.state.email) &&
          !this.state.keyboardOpen
            ? this.props.validationError
            : ""}
        </Text>
      </View>
    );
  }

  focus() {
    this.textInput.current!.focus();
  }

  _isValid = (email?: string): boolean => {
    // accepts international email addresses
    const validationPattern = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    return email != null && validationPattern.test(email!);
  };
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
  },
  errorText: {
    color: "red",
    fontFamily: "OpenSans-Regular",
    fontSize: 15,
    height: 21,
  },
  input: {
    marginVertical: 10,
  },
});
