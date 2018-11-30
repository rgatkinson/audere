import React from "react";
import {
  ReturnKeyTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";

interface Props {
  autoFocus?: boolean;
  returnKeyType: ReturnKeyTypeOptions;
  value?: string;
  onChange(text: string): void;
  onSubmit(): void;
}

class EmailInput extends React.Component<Props & WithNamespaces> {
  textInput = React.createRef<TextInput>();

  // TODO: validate on submit
  // TODO: accept a required prop and show error if required and not entered
  render() {
    const { t } = this.props;

    return (
      <View style={styles.container}>
        <TextInput
          autoFocus={this.props.autoFocus}
          keyboardType="email-address"
          placeholder={t("emailAddress")}
          ref={this.textInput}
          returnKeyType={this.props.returnKeyType}
          style={styles.textInput}
          value={this.props.value}
          onChangeText={this.props.onChange}
          onSubmitEditing={this.props.onSubmit}
        />
        <Text style={styles.disclaimer}>{t("disclaimer")}</Text>
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
    marginVertical: 20,
  },
  disclaimer: {
    fontFamily: "OpenSans-Regular",
    fontSize: 17,
    letterSpacing: -0.41,
    lineHeight: 26,
    marginTop: 20,
  },
  textInput: {
    borderBottomColor: "#bbb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    fontFamily: "OpenSans-Regular",
    fontSize: 17,
    height: 30,
    letterSpacing: -0.41,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
});

export default withNamespaces("emailInput")<Props>(EmailInput);
