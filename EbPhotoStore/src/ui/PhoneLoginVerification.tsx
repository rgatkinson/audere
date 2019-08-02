import React from "react";
import { Alert, StyleSheet, View, ActivityIndicator } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import firebase, { RNFirebase } from "react-native-firebase";
import Modal from "react-native-modal";
import Button from "./components/Button";
import DigitInput from "./components/DigitInput";
import Text from "./components/Text";
import { GUTTER, PRIMARY_COLOR } from "./styles";

const DEFAULT_COUNTRY_CODE_US = "+1";
const DEFAULT_COUNTRY_CODE_CONGO = "+243";
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
  validating: boolean;
}

class PhoneLoginVerification extends React.Component<
  Props & WithNamespaces,
  State
> {
  state: State = {
    validating: false
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
    console.log("***** Starting login");

    this.setState({ validating: false });
    if (!this._authUnsubscribe) {
      this._authUnsubscribe = firebase
        .auth()
        .onAuthStateChanged(this._onAuthChanged);
    }
    try {
      this._confirmer = await firebase
        .auth()
        .signInWithPhoneNumber(this._getCanonicalPhone());
      console.log("***** Have confirmer?", !!this._confirmer);
    } catch (error) {
      Alert.alert(this.props.t("authErrorTitle"), error.message);
    }
  };

  _runValidation = async (code: string) => {
    try {
      console.log("***** Here's the code", code);
      const user = await this._confirmer!.confirm(code);

      console.log("***** Logged in?", !!user);
      if (user) {
        this.props.onDismiss(PhoneVerificationDismissal.VERIFIED);
        return;
      }
    } catch {
      // fall through to error handler below
    }
    this.setState({ validating: false });

    const { t } = this.props;
    Alert.alert(t("incorrectCodeTitle"), t("incorrectCodeBody"));
  };

  _validateCode = async (code: string) => {
    console.log("***** Validating with confirmer:", !!this._confirmer);
    if (this._confirmer) {
      this.setState({ validating: true }, () => this._runValidation(code));
    } else {
      const { t } = this.props;
      Alert.alert(t("incorrectCodeTitle"), t("incorrectCodeBody"));
    }
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
    const { validating } = this.state;
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
          <DigitInput digits={6} onSubmitEditing={this._validateCode} />
          {validating ? (
            <ActivityIndicator size={"large"} color={PRIMARY_COLOR} />
          ) : null}
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
