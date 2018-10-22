// Input field component that adds validation and styling to TextInput

import React from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  KeyboardTypeOptions,
} from "react-native";

export type InputType =
  | "id"
  | "password"
  | "nonNegativeInteger"
  | "phone"
  | "email"
  | "text-short"
  | "address";
let validationPatterns: { [index: string]: RegExp } = {
  id: /^[a-zA-Z0-9_-]{1,16}$/,
  password: /^.{1,}$/,
  nonNegativeInteger: /^[0-9]+$/,
  phone: /^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/,
  // 7 or 10 digit US phone
  email: /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/,
  "text-short": /^.{1,}$/,
  address: /^.{1,}$/,
};
interface Props {
  style?: any;
  inputType: InputType;
  autoFocus?: boolean;
  optional?: boolean; // default is false
  myRef?: ((arg: any) => void) | React.RefObject<TextInput>; // cannot use "ref" for some reason
  defaultValue?: string;
  min?: number; // for nonNegativeInteger type, denotes min value; for other types, min length
  max?: number; // for nonNegativeInteger type, denotes max value, for other types, max length
  placeholder?: string;
  onChangeText(arg: any): void;
  onSubmitEditing?(): void;
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
      isMissing: false,
      isPatternError: false,
      isMinMaxError: false, // min or max validation failed
      errMessage: null,
      value: this.props.defaultValue,
    };
    switch (this.props.inputType) {
      case "email":
        this.style = [styles.inputField, styles.mediumWidth];
        this.autoCapitalize = "none";
        this.keyboardType = "email-address";
        break;
      case "phone":
        this.style = [styles.inputField, styles.mediumWidth];
        this.keyboardType = "phone-pad";
        break;
      case "address":
        this.style = [styles.inputField, styles.wideWidth];
        this.autoCapitalize = "words";
        break;
      case "nonNegativeInteger":
        this.style = [styles.inputField, styles.smallWidth];
        this.keyboardType = "numeric";
        break;
      case "id":
        this.style = [styles.inputField, styles.smallWidth];
        this.autoCapitalize = "none";
        this.keyboardType = "email-address";
        break;
      case "password":
        this.style = [styles.inputField, styles.smallWidth];
        this.secureTextEntry = true;
        break;
      case "text-short":
      default:
        this.style = [styles.inputField, styles.smallWidth];
    }
  }
  checkErrors(): void {
    // Checks for presence, then pattern, then min/max
    // Sets the following state variables: isMissing, isPatternError, isMinMaxError, errMessage
    let value = this.state.value;
    let inputType = this.props.inputType;
    let minError: boolean = false;
    let maxError: boolean = false;
    let errString: string = "";
    this.setState({
      isMissing: false,
      isMinMaxError: false,
      isPatternError: false,
      errMessage: null,
    });
    console.log("checkErrors: value=" + value + " inputType=" + inputType);
    if (this.props.optional && (value == undefined || value.length == 0)) {
      return;
    }
    if (value == undefined || value.length == 0) {
      this.setState({
        isMissing: true,
        errMessage: "Required",
      });
      return;
    }
    if (!validationPatterns[inputType].test(value)) {
      this.setState({
        isPatternError: true,
        errMessage: "Invalid format for " + inputType,
      });
      return;
    }
    if (this.props.min !== undefined) {
      if (inputType == "nonNegativeInteger") {
        if (+value < this.props.min) {
          minError = true;
          errString = "Minimum is " + this.props.min;
        }
      } else {
        if (value.length < this.props.min) {
          minError = true;
          errString = "Minimum " + this.props.min + " characters";
        }
      }
    }
    if (this.props.max !== undefined) {
      if (inputType == "nonNegativeInteger") {
        if (+value > this.props.max) {
          maxError = true;
          errString = "Maximum is " + this.props.max;
        }
      } else {
        if (value.length > this.props.max) {
          maxError = true;
          errString = "Maximum " + this.props.max + " characters";
        }
      }
    }
    this.setState({
      isMinMaxError: minError || maxError,
      errMessage: errString.length > 0 ? errString : null,
    });
  }

  render() {
    return (
      <View>
        <TextInput
          style={[
            this.style,
            this.state.isMissing ||
            this.state.isMinMaxError ||
            this.state.isPatternError
              ? styles.errorBorder
              : null,
            this.props.style,
          ]}
          ref={this.props.myRef}
          autoFocus={this.props.autoFocus}
          keyboardType={this.keyboardType}
          autoCapitalize={this.autoCapitalize}
          defaultValue={this.props.defaultValue}
          underlineColorAndroid="rgba(0,0,0,0)"
          secureTextEntry={this.secureTextEntry}
          placeholder={this.props.placeholder}
          onChangeText={value => {
            this.setState({ value });
            this.props.onChangeText(value);
          }}
          onSubmitEditing={() => {
            this.checkErrors();
            // console.log("isMissing=" + this.state.isMissing);
            // console.log("isMinMaxError=" + this.state.isMinMaxError);
            // console.log("isPatternError=" + this.state.isPatternError);
            // console.log("errMessage=" + this.state.errMessage);
            if (this.props.onSubmitEditing !== undefined) {
              this.props.onSubmitEditing();
            }
          }}
        />
        <Text style={styles.errorMessage}>{this.state.errMessage}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  inputField: {
    marginBottom: 1,
    backgroundColor: "#fff",
    paddingLeft: 5,
  },
  smallWidth: {
    width: 100,
  },
  mediumWidth: {
    width: 150,
  },
  wideWidth: {
    width: 250,
  },
  errorBorder: {
    borderColor: "red",
    borderWidth: 3,
  },
  errorMessage: {
    marginTop: 0,
    paddingTop: 0,
    marginBottom: 5,
    color: "red",
  },
});
