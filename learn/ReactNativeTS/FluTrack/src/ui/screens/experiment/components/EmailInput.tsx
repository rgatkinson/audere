import React from "react";
import { ReturnKeyTypeOptions, StyleSheet, Text, TextInput, View } from "react-native";

interface Props {
  autoFocus?: boolean;
  returnKeyType: ReturnKeyTypeOptions;
  value?: string;
  onChange(text: string): void;
  onSubmit(): void;
}

export default class EmailInput extends React.Component<Props> {

  textInput: TextInput | null = null;

  // TODO: validate on submit
  // TODO: accept a required prop and show error if required and not entered
  render() {

    const disclaimer = "You can opt out of receiving Seattle Flu Study emails at any time."

    return (
      <View style={styles.container}>
        <TextInput
          autoFocus={this.props.autoFocus}
          keyboardType='email-address'
          placeholder='Email address'
          ref={(input) =>  this.textInput = input }
          returnKeyType={this.props.returnKeyType}
          style={styles.textInput}
          value={this.props.value}
          onChangeText={(text) => this.props.onChange(text)}
          onSubmitEditing={this.props.onSubmit}
        />
        <Text style={styles.disclaimer}>
          {disclaimer}
        </Text>
      </View>
    );
  }

  focus() {
    this.textInput!.focus();
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    marginVertical: 20,
  },
  disclaimer: {
    fontSize: 20,
    marginTop: 20,
  },
  textInput: {
    borderBottomColor: '#bbb',
    borderBottomWidth: StyleSheet.hairlineWidth,
    fontSize: 20,
    height: 30,
  },
});
