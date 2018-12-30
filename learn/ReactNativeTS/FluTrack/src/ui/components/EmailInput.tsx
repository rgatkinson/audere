import React from "react";
import {
  Keyboard,
  ReturnKeyTypeOptions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import TextInput from "./TextInput";

interface Props extends React.Props<EmailInput> {
  autoFocus?: boolean;
  placeholder: string;
  returnKeyType: ReturnKeyTypeOptions;
  validationError: string;
  value?: string;
  onChange(text: string): void;
  onSubmit?(): void;
}

interface State {
  submitted: boolean;
}

export default class EmailInput extends React.Component<Props, State> {
  state = {
    submitted: false,
  };

  keyboardDidHideListener: any;

  componentDidMount() {
    this.keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        this.setState({ submitted: true });
      }
    );
  }

  componentWillUnmount() {
    this.keyboardDidHideListener.remove();
  }

  textInput = React.createRef<TextInput>();

  render() {
    return (
      <View style={styles.container}>
        <TextInput
          autoCapitalize="none"
          autoFocus={this.props.autoFocus}
          keyboardType="email-address"
          placeholder={this.props.placeholder}
          ref={this.textInput}
          returnKeyType={this.props.returnKeyType}
          value={this.props.value}
          onChangeText={(text: string) => {
            this.props.onChange(text);
          }}
          onSubmitEditing={() => {
            this.setState({ submitted: true });
            if (this.props.onSubmit != null) {
              this.props.onSubmit();
            }
          }}
        />
        <Text style={styles.errorText}>
          {this.state.submitted && !this.isValid()
            ? this.props.validationError
            : ""}
        </Text>
      </View>
    );
  }

  focus() {
    this.textInput.current!.focus();
  }

  isValid = (value: string | undefined = this.props.value): boolean => {
    const validationPattern = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
    return value != null && validationPattern.test(value!);
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
});
