import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  StyleSheet,
  Alert,
  View
} from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import firebase, { RNFirebase } from "react-native-firebase";
import Button from "./components/Button";
import NumberInput from "./components/NumberInput";
import Text from "./components/Text";
import { GUTTER, DISABLED_COLOR } from "./styles";

const DEFAULT_COUNTRY_CODE = "+1";
const TEST_PHONE_NUMBER = "2068675309";

export enum PhoneVerificationDismissal {
  CANCELED,
  VERIFIED
}

interface Props {
  phone: string;
  visible: boolean;
  onDismiss(reason: PhoneVerificationDismissal): void;
}

interface State {
  code: string;
}

class PhoneLoginVerification extends React.Component<
  Props & WithNamespaces,
  State
> {
  state: State = {
    code: ""
  };

  _codeInput: React.RefObject<NumberInput> | null = null;
  _authUnsubscribe: (() => void) | null = null;
  _confirmer: RNFirebase.ConfirmationResult | null = null;

  componentWillUnmount() {
    if (this._authUnsubscribe) {
      this._authUnsubscribe();
      this._authUnsubscribe = null;
    }
  }

  _getCanonicalPhone() {
    if (this.props.phone.startsWith("+")) {
      return this.props.phone;
    }

    // Allows us to easily use the test account
    return (
      DEFAULT_COUNTRY_CODE +
      (this.props.phone.length == 1 ? TEST_PHONE_NUMBER : this.props.phone)
    );
  }

  _startFirebaseLogin = async () => {
    if (!this._authUnsubscribe) {
      this._authUnsubscribe = firebase
        .auth()
        .onAuthStateChanged(this._onAuthChanged);
    }
    try {
      this._confirmer = await firebase
        .auth()
        .signInWithPhoneNumber(this._getCanonicalPhone());
    } catch (error) {
      Alert.alert(this.props.t("authErrorTitle"), error.message);
    }
  };

  _onChangeCode = (code: string) => {
    this.setState({ code });
  };

  _validateCode = async () => {
    if (this._confirmer) {
      try {
        const user = await this._confirmer.confirm(this.state.code);

        if (user) {
          this.props.onDismiss(PhoneVerificationDismissal.VERIFIED);
          return;
        }
      } catch {
        // fall through to error handler below
      }
    }

    const { t } = this.props;
    Alert.alert(t("incorrectCodeTitle"), t("incorrectCodeBody"));
  };

  _onAuthChanged = (user: RNFirebase.User | null) => {
    if (!!user) {
      this.props.onDismiss(PhoneVerificationDismissal.VERIFIED);
    }
  };

  _onCancel = () => {
    this.props.onDismiss(PhoneVerificationDismissal.CANCELED);
  };

  render() {
    const { t } = this.props;
    return (
      <Modal
        visible={this.props.visible}
        transparent={true}
        onRequestClose={this._onCancel}
        onShow={this._startFirebaseLogin}
      >
        <KeyboardAvoidingView style={styles.container} behavior="padding">
          <Text content={t("verificationCode")} />
          <NumberInput
            placeholder={t("placeholder")}
            ref={this._codeInput}
            returnKeyType="next"
            style={styles.input}
            value={this.state.code}
            onChangeText={this._onChangeCode}
            onSubmitEditing={this._validateCode}
          />
          <View style={styles.buttons}>
            <Button
              label={t("common:cancel")}
              enabled={true}
              primary={false}
              style={styles.button}
              onPress={this._onCancel}
            />
            <Button
              enabled={this.state.code.length > 0}
              label={t("common:button:submit")}
              primary={true}
              style={styles.button}
              onPress={this._validateCode}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }
}

export default withNamespaces("phoneLoginVerification")(PhoneLoginVerification);

const styles = StyleSheet.create({
  button: {
    margin: GUTTER,
    width: 125
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  container: {
    margin: GUTTER * 2,
    padding: GUTTER,
    backgroundColor: DISABLED_COLOR,
    maxHeight: 200
  },
  input: {
    marginBottom: GUTTER
  }
});
