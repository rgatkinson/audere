import React from "react";
import { ReturnKeyTypeOptions, StyleSheet, View } from "react-native";
import KeyboardListener from "react-native-keyboard-listener";
import Text from "./Text";
import TextInput from "./TextInput";
import { ERROR_COLOR, FONT_NORMAL, GUTTER } from "../styles";
import { isValidEmail } from "../../util/check";

interface Props extends React.Props<EmailInput> {
  autoFocus: boolean;
  placeholder: string;
  returnKeyType: ReturnKeyTypeOptions;
  validationError: string;
  value?: string;
  onChange(email: string): void;
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
            this.props.onChange(text);
          }}
          onSubmitEditing={() => {}}
        />
        <Text
          content={
            !isValidEmail(this.state.email) && !this.state.keyboardOpen
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
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    marginBottom: GUTTER / 2,
  },
  errorText: {
    color: ERROR_COLOR,
    fontFamily: FONT_NORMAL,
    marginTop: GUTTER / 4,
  },
});
