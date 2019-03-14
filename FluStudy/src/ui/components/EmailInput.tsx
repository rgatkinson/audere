import React from "react";
import { ReturnKeyTypeOptions, StyleSheet, View } from "react-native";
import Text from "./Text";
import TextInput from "./TextInput";
import { ERROR_COLOR, FONT_NORMAL, GUTTER } from "../styles";
import { isValidEmail } from "../../util/check";

interface Props extends React.Props<EmailInput> {
  autoFocus: boolean;
  placeholder: string;
  returnKeyType: ReturnKeyTypeOptions;
  shouldValidate: boolean;
  validationError: string;
  value?: string;
  onChange(email: string): void;
  onSubmitEditing?: () => void;
}

interface State {
  email?: string;
}

export default class EmailInput extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      email: props.value,
    };
  }

  textInput = React.createRef<TextInput>();

  render() {
    return (
      <View style={styles.container}>
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
          onSubmitEditing={this.props.onSubmitEditing}
        />
        <Text
          content={
            !isValidEmail(this.state.email) && this.props.shouldValidate
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
