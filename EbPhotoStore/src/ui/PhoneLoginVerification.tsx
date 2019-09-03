import React, { Fragment } from "react";
import { Alert, Dimensions, Modal, StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import firebase, { RNFirebase } from "react-native-firebase";
import Button from "./components/Button";
import DigitInput from "./components/DigitInput";
import Text from "./components/Text";
import { GUTTER } from "./styles";

const DEFAULT_COUNTRY_CODE_US = "+1";
const DEFAULT_COUNTRY_CODE_CONGO = "+243";
const TEST_PHONE_NUMBER = "2068675309";

export enum PhoneVerificationDismissal {
  CANCELED,
  VERIFIED,
}

interface Props {
  phone: string;
  visible: boolean;
  onDismiss(reason: PhoneVerificationDismissal): void;
}

class PhoneLoginVerification extends React.Component<Props & WithNamespaces> {
  _authUnsubscribe: (() => void) | null = null;
  _confirmer: RNFirebase.ConfirmationResult | null = null;

  componentWillUnmount() {
    if (this._authUnsubscribe) {
      this._authUnsubscribe();
      this._authUnsubscribe = null;
    }
  }

  _getCanonicalPhone() {
    const { phone } = this.props;
    if (phone.startsWith("+")) {
      return phone;
    }
    const prefix =
      phone.length === 1 || phone.length === 10
        ? DEFAULT_COUNTRY_CODE_US
        : DEFAULT_COUNTRY_CODE_CONGO;

    // Allows us to easily use the test account
    return prefix + (phone.length === 1 ? TEST_PHONE_NUMBER : this.props.phone);
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

  _validateCode = async (code: string) => {
    if (this._confirmer) {
      try {
        const user = await this._confirmer.confirm(code);

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
      <Fragment>
        {visible && <View style={styles.overlay} />}
        <Modal
          animationType="fade"
          transparent={true}
          visible={visible}
          onRequestClose={this._onCancel}
          onShow={this._startFirebaseLogin}
        >
          <View style={styles.modal}>
            <Text content={t("verificationCode", { phone })} />
            <DigitInput digits={6} onSubmitEditing={this._validateCode} />
            <View style={styles.buttons}>
              <Button
                label={t("common:cancel")}
                enabled={true}
                primary={false}
                style={[styles.button, { marginRight: GUTTER }]}
                onPress={this._onCancel}
              />
            </View>
          </View>
        </Modal>
      </Fragment>
    );
  }
}

export default withNamespaces("phoneLoginVerification")(PhoneLoginVerification);

const styles = StyleSheet.create({
  button: {
    marginTop: GUTTER,
    marginBottom: 0,
    flex: 1,
  },
  buttons: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  modal: {
    alignSelf: "stretch",
    alignItems: "center",
    backgroundColor: "white",
    justifyContent: "center",
    left: GUTTER,
    padding: GUTTER,
    position: "absolute",
    right: GUTTER,
    top: Dimensions.get("window").height / 5,
  },
  overlay: {
    backgroundColor: "black",
    bottom: 0,
    left: 0,
    opacity: 0.5,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
