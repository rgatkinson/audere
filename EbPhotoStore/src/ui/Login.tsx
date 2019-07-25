import React from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { login, Action, ChwData, StoreState } from "../store";
import Button from "./components/Button";
import NumberInput from "./components/NumberInput";
import TextInput from "./components/TextInput";
import Text from "./components/Text";
import Title from "./components/Title";
import { GUTTER } from "./styles";

interface Props {
  chwData?: ChwData;
  dispatch(action: Action): void;
}

class Login extends React.Component<Props> {
  state = {
    firstName: this.props.chwData && this.props.chwData.firstName,
    lastName: this.props.chwData && this.props.chwData.lastName,
    phone: this.props.chwData && this.props.chwData.phone,
    notes: this.props.chwData && this.props.chwData.notes
  };

  _firstNameInput: any;
  _phoneInput: any;
  _notesInput: any;

  constructor(props: Props) {
    super(props);
    this._firstNameInput = React.createRef<TextInput>();
    this._phoneInput = React.createRef<NumberInput>();
    this._notesInput = React.createRef<TextInput>();
  }

  _updateLastName = (lastName: string) => {
    this.setState({ lastName });
  };

  _focusFirstName = () => {
    this._firstNameInput.current!.focus();
  };

  _updateFirstName = (firstName: string) => {
    this.setState({ firstName });
  };

  _focusPhone = () => {
    this._phoneInput.current!.focus();
  };

  _updatePhone = (phone: string) => {
    this.setState({ phone });
  };

  _focusNotes = () => {
    this._notesInput.current!.focus();
  };

  _updateNotes = (notes: string) => {
    this.setState({ notes });
  };

  _login = () => {
    this.props.dispatch(
      login({
        lastName: this.state.lastName!,
        firstName: this.state.firstName!,
        phone: this.state.phone!,
        notes: this.state.notes
      })
    );
  };

  render() {
    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <ScrollView style={styles.content}>
          <Title label="Enter your information below to begin tracking patients you test for Ebola." />
          <Text content="Last Name" />
          <TextInput
            placeholder="Last Name"
            returnKeyType="next"
            style={styles.input}
            value={this.state.lastName}
            onChangeText={this._updateLastName}
            onSubmitEditing={this._focusFirstName}
          />
          <Text content="First Name" />
          <TextInput
            placeholder="First Name"
            ref={this._firstNameInput}
            returnKeyType="next"
            style={styles.input}
            value={this.state.firstName}
            onChangeText={this._updateFirstName}
            onSubmitEditing={this._focusPhone}
          />
          <Text content="Mobile number" />
          <NumberInput
            placeholder="Phone Number"
            ref={this._phoneInput}
            returnKeyType="next"
            style={styles.input}
            value={this.state.phone}
            onChangeText={this._updatePhone}
            onSubmitEditing={this._focusNotes}
          />
          <Text
            bold={true}
            content="Notes to share with government health team"
          />
          <Text content="(e.g. your location, credentials, etc.)" />
          <TextInput
            placeholder=""
            multiline={true}
            numberOfLines={2}
            ref={this._notesInput}
            returnKeyType="done"
            style={styles.input}
            value={this.state.notes}
            onChangeText={this._updateNotes}
          />
        </ScrollView>
        <Button
          enabled={
            !!this.state.lastName &&
            !!this.state.firstName &&
            !!this.state.phone
          }
          label="Login"
          primary={true}
          style={styles.button}
          onPress={this._login}
        />
      </KeyboardAvoidingView>
    );
  }
}

export default connect((state: StoreState) => ({
  chwData: state.meta.chwData
}))(Login);

const styles = StyleSheet.create({
  button: {
    alignSelf: "center",
    marginVertical: GUTTER / 2
  },
  container: {
    flex: 1
  },
  content: {
    padding: GUTTER
  },
  input: {
    marginBottom: GUTTER
  }
});
