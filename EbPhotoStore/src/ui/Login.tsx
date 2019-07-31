import React from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { HealthWorkerInfo } from "audere-lib/ebPhotoStoreProtocol";
import { login, Action, StoreState } from "../store";
import Button from "./components/Button";
import NumberInput from "./components/NumberInput";
import TextInput from "./components/TextInput";
import Text from "./components/Text";
import Title from "./components/Title";
import { GUTTER } from "./styles";
import PhoneLoginVerification, {
  PhoneVerificationDismissal
} from "./PhoneLoginVerification";

interface Props {
  healthWorkerInfo?: HealthWorkerInfo;
  dispatch(action: Action): void;
}

interface State {
  firstName?: string;
  lastName?: string;
  phone?: string;
  notes: string;
  showConfirmation: boolean;
}

class Login extends React.Component<Props & WithNamespaces, State> {
  _lastNameInput: any;
  _phoneInput: any;
  _notesInput: any;

  constructor(props: Props & WithNamespaces) {
    super(props);

    if (props.healthWorkerInfo != null) {
      const { firstName, lastName, phone, notes } = props.healthWorkerInfo;
      this.state = {
        firstName,
        lastName,
        phone,
        notes,
        showConfirmation: false
      };
    } else {
      this.state = {
        notes: "",
        showConfirmation: false
      };
    }

    this._lastNameInput = React.createRef<TextInput>();
    this._phoneInput = React.createRef<NumberInput>();
    this._notesInput = React.createRef<TextInput>();
  }

  _updateFirstName = (firstName: string) => {
    this.setState({ firstName });
  };

  _updateLastName = (lastName: string) => {
    this.setState({ lastName });
  };

  _focusLastName = () => {
    this._lastNameInput.current!.focus();
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
    this.setState({ showConfirmation: true });
  };

  _onConfirmationDismssed = (reason: PhoneVerificationDismissal) => {
    if (reason === PhoneVerificationDismissal.VERIFIED) {
      this.props.dispatch(
        login({
          lastName: this.state.lastName!,
          firstName: this.state.firstName!,
          phone: this.state.phone!,
          notes: this.state.notes ? this.state.notes : ""
        })
      );

      // We don't setState here because the login() call above will unmount us,
      // making the setState call invalid.
      return;
    }
    this.setState({ showConfirmation: false });
  };

  render() {
    const { t } = this.props;
    const { lastName, firstName, phone, notes } = this.state;
    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <PhoneLoginVerification
          phone={this.state.phone || ""}
          visible={this.state.showConfirmation}
          onDismiss={this._onConfirmationDismssed}
        />
        <ScrollView style={styles.content}>
          <Title label={t("title")} />
          <Text
            content={t("loginFirstName")}
            style={[styles.titleRow, { paddingTop: 0 }]}
          />
          <TextInput
            autoFocus={true}
            placeholder=""
            returnKeyType="next"
            style={styles.inputSingle}
            value={firstName}
            onChangeText={this._updateFirstName}
            onSubmitEditing={this._focusLastName}
          />
          <Text content={t("loginLastName")} style={styles.titleRow} />
          <TextInput
            placeholder=""
            ref={this._lastNameInput}
            returnKeyType="next"
            style={styles.inputSingle}
            value={lastName}
            onChangeText={this._updateLastName}
            onSubmitEditing={this._focusPhone}
          />
          <Text content={t("loginMobileNumber")} style={styles.titleRow} />
          <NumberInput
            placeholder=""
            ref={this._phoneInput}
            returnKeyType="next"
            style={styles.inputSingle}
            value={phone}
            onChangeText={this._updatePhone}
            onSubmitEditing={this._focusNotes}
          />
          <Text content={t("notes")} style={styles.titleRow} />
          <TextInput
            blurOnSubmit={true}
            placeholder={t("notesPlaceholder")}
            multiline={true}
            numberOfLines={3}
            ref={this._notesInput}
            returnKeyType="done"
            style={styles.inputMulti}
            value={notes}
            onChangeText={this._updateNotes}
          />
        </ScrollView>
        <Button
          enabled={!!lastName && !!firstName && !!phone}
          label={t("login")}
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
}))(withNamespaces("login")(Login));

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
  titleRow: {
    paddingTop: GUTTER,
    paddingBottom: GUTTER / 4
  },
  inputSingle: {
    padding: 0
  },
  inputMulti: {
    borderWidth: 1
  }
});
