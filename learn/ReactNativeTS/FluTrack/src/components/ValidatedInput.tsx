// Input field component that adds validation and styling to TextInput

import React from "react";
import { StyleSheet, TextInput, KeyboardTypeOptions } from "react-native";

export type InputType =
  | "id"
  | "password"
  | "number"
  | "phone"
  | "email"
  | "text-short"
  | "address";
let validationPatterns: { [index: string]: RegExp } = {
  id: /^[a-zA-Z0-9_-]{1,16}$/,
  password: /^.{1,}$/,
  number: /^[0-9]+$/,
  phone: /^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/,
  email: /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/,
  "text-short": /^.{1,}$/,
  address: /^.{1,}$/
};
interface Props {
  style?: any;
  inputType: InputType;
  autoFocus?: boolean;
  required?: boolean; // default is true
  placeholder?: string;
  onChangeText(arg: any): void;
  onSubmit?(): void;
}

function isValid(text: string, inputType: string): boolean {
  // Return true if valid, false if invalid
  return validationPatterns[inputType].test(text);
}
export default class ValidatedInput extends React.Component<Props, any> {
  private style: any;
  private keyboardType: KeyboardTypeOptions = "default";
  private autoCapitalize:
    | "none"
    | "sentences"
    | "words"
    | undefined = undefined;
  private secureTextEntry: boolean = false;
  constructor(props: Props) {
    super(props);
    this.state = {
      isError: false
    };
    switch (this.props.inputType) {
      case "email":
        this.style = [styles.inputField, styles.mediumWidth];
        this.autoCapitalize = "none";
        this.keyboardType = "email-address";
        break;
      case "phone":
        this.style = styles.inputField & styles.mediumWidth;
        this.keyboardType = "phone-pad";
        break;
      case "address":
        this.style = styles.inputField & styles.wideWidth;
        this.autoCapitalize = "words";
        break;
      case "number":
        this.style = styles.inputField & styles.smallWidth;
        this.keyboardType = "numeric";
        break;
      case "id":
        this.style = styles.inputField & styles.smallWidth;
        this.autoCapitalize = "none";
        this.keyboardType = "email-address";
        break;
      case "password":
        this.style = styles.inputField & styles.smallWidth;
        this.secureTextEntry = true;
        break;
      case "text-short":
      default:
        this.style = styles.inputField & styles.smallWidth;
    }
  }
  render() {
    return (
      <TextInput
        style={[this.style, this.state.isError ? styles.errorBorder : null]}
        autoFocus={this.props.autoFocus}
        keyboardType={this.keyboardType}
        autoCapitalize={this.autoCapitalize}
        underlineColorAndroid="rgba(0,0,0,0)"
        secureTextEntry={this.secureTextEntry}
        placeholder={this.props.placeholder}
        onChangeText={value => {
          this.setState({ value });
          this.props.onChangeText(value);
        }}
        onSubmitEditing={() => {
          this.setState({
            isError: !isValid(this.state.value, this.props.inputType)
          });
          if (this.props.onSubmit !== undefined) {
            this.props.onSubmit();
          }
        }}
      />
    );
  }
}

const styles = StyleSheet.create({
  inputField: {
    marginBottom: 10,
    backgroundColor: "#fff",
    paddingLeft: 5
  },
  smallWidth: {
    width: 100
  },
  mediumWidth: {
    width: 150
  },
  wideWidth: {
    width: 250
  },
  errorBorder: {
    borderColor: "red",
    borderWidth: 3
  }
});
