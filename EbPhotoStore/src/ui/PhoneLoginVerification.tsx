import React from "react";
import { Alert, Dimensions, StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import firebase, { RNFirebase } from "react-native-firebase";
import Modal from "react-native-modal";
import Button from "./components/Button";
import DigitInput from "./components/DigitInput";
import Text from "./components/Text";
import { GUTTER, STATUS_BAR_HEIGHT } from "./styles";

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
    this._validateCode();
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
    const { phone, t, visible } = this.props;
    return (
      <Modal
        animationIn={"fadeIn"}
        animationOut={"fadeOut"}
        avoidKeyboard={true}
        backdropOpacity={0.5}
        coverScreen={false}
        isVisible={visible}
        style={styles.modal}
        onModalWillShow={this._startFirebaseLogin}
      >
        <View style={styles.container}>
          <Text content={t("verificationCode", { phone })} />
          <DigitInput digits={6} onSubmitEditing={this._onChangeCode} />
          <View style={styles.buttons}>
            <Button
              label={t("common:cancel")}
              enabled={true}
              primary={false}
              style={[styles.button, { marginRight: GUTTER }]}
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
        </View>
      </Modal>
    );
  }
}

export default withNamespaces("phoneLoginVerification")(PhoneLoginVerification);

const styles = StyleSheet.create({
  button: {
    marginTop: GUTTER,
    marginBottom: 0,
    flex: 1
  },
  buttons: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center"
  },
  container: {
    alignSelf: "stretch",
    backgroundColor: "white",
    justifyContent: "center",
    opacity: 1,
    padding: GUTTER
  },
  modal: {
    alignItems: "center",
    justifyContent: "center"
  }
});
