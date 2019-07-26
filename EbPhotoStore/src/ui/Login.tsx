import React from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { HealthWorkerInfo } from "audere-lib/ebPhotoStoreProtocol";
import { login, Action, StoreState } from "../store";
import Button from "./components/Button";
import NumberInput from "./components/NumberInput";
import TextInput from "./components/TextInput";
import Text from "./components/Text";
import Title from "./components/Title";
import { GUTTER } from "./styles";

interface Props {
  healthWorkerInfo?: HealthWorkerInfo;
  dispatch(action: Action): void;
}

interface State {
  firstName?: string;
  lastName?: string;
  phone?: string;
  notes: string;
}

class Login extends React.Component<Props, State> {
  _firstNameInput: any;
  _phoneInput: any;
  _notesInput: any;

  constructor(props: Props) {
    super(props);

    if (props.healthWorkerInfo != null) {
      const { firstName, lastName, phone, notes } = props.healthWorkerInfo;
      this.state = {
        firstName,
        lastName,
        phone,
        notes
      };
    } else {
      this.state = {};
    }

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
        notes: this.state.notes ? this.state.notes : ""
      })
    );
  };

  render() {
    const { lastName, firstName, phone, notes } = this.state;
    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <ScrollView style={styles.content}>
          <Title label="Enter your information below to begin tracking patients you test for Ebola." />
          <Text content="Last Name" />
          <TextInput
            placeholder="Last Name"
            returnKeyType="next"
            style={styles.input}
            value={lastName}
            onChangeText={this._updateLastName}
            onSubmitEditing={this._focusFirstName}
          />
          <Text content="First Name" />
          <TextInput
            placeholder="First Name"
            ref={this._firstNameInput}
            returnKeyType="next"
            style={styles.input}
            value={firstName}
            onChangeText={this._updateFirstName}
            onSubmitEditing={this._focusPhone}
          />
          <Text content="Mobile number" />
          <NumberInput
            placeholder="Phone Number"
            ref={this._phoneInput}
            returnKeyType="next"
            style={styles.input}
            value={phone}
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
            value={notes}
            onChangeText={this._updateNotes}
          />
        </ScrollView>
        <Button
          enabled={!!lastName && !!firstName && !!phone}
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
  healthWorkerInfo: state.meta.healthWorkerInfo
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
