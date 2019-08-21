import React, { Fragment } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
} from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import firebase from "react-native-firebase";
import { HealthWorkerInfo } from "audere-lib/ebPhotoStoreProtocol";
import { login, Action, StoreState } from "../store";
import Button from "./components/Button";
import LabelTextInput from "./components/LabelTextInput";
import NumberInput from "./components/NumberInput";
import TextInput from "./components/TextInput";
import LabelNumberInput from "./components/LabelNumberInput";
import Title from "./components/Title";
import { GUTTER, FONT_COLOR, FONT_ROBO_MEDIUM, REGULAR_TEXT } from "./styles";
import PhoneLoginVerification, {
  PhoneVerificationDismissal,
} from "./PhoneLoginVerification";

interface Props {
  healthWorkerInfo?: HealthWorkerInfo;
  dispatch(action: Action): void;
}

interface State {
  keyboardOpen: boolean;
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
  _keyboardDidShowListener: any;
  _keyboardDidHideListener: any;

  constructor(props: Props & WithNamespaces) {
    super(props);

    if (props.healthWorkerInfo != null) {
      const { firstName, lastName, phone, notes } = props.healthWorkerInfo;
      this.state = {
        keyboardOpen: false,
        firstName,
        lastName,
        phone,
        notes,
        showConfirmation: false,
      };
    } else {
      this.state = {
        keyboardOpen: false,
        notes: "",
        showConfirmation: false,
      };
    }

    this._lastNameInput = React.createRef<TextInput>();
    this._phoneInput = React.createRef<NumberInput>();
    this._notesInput = React.createRef<TextInput>();
  }

  componentDidMount() {
    this._keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      this._keyboardDidShow
    );
    this._keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      this._keyboardDidHide
    );
  }

  componentWillUnmount() {
    this._keyboardDidShowListener.remove();
    this._keyboardDidHideListener.remove();
  }

  _keyboardDidShow = () => {
    this.setState({ keyboardOpen: true });
  };

  _keyboardDidHide = () => {
    this.setState({ keyboardOpen: false });
  };

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
          notes: this.state.notes ? this.state.notes : "",
          uid: firebase.auth().currentUser!.uid,
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
    const { firstName, lastName, notes, phone } = this.state;

    return (
      <Fragment>
        <KeyboardAvoidingView style={styles.container} behavior="padding">
          <ScrollView style={styles.content}>
            <Title label={t("signIn")} />
            <LabelTextInput
              autoCapitalize="words"
              autoFocus={true}
              inputValue={firstName}
              onChangeText={this._updateFirstName}
              onSubmitEditing={this._focusLastName}
              placeholder=""
              returnKeyType="next"
              textContent={t("loginFirstName")}
              textStyle={[styles.titleRow, { paddingTop: 0 }]}
            />
            <LabelTextInput
              autoCapitalize="words"
              ref={this._lastNameInput}
              inputValue={lastName}
              onChangeText={this._updateLastName}
              onSubmitEditing={this._focusPhone}
              placeholder=""
              returnKeyType="next"
              textContent={t("loginLastName")}
              textStyle={[styles.titleRow]}
            />
            <LabelNumberInput
              keyboardType={"phone-pad"}
              placeholder=""
              ref={this._phoneInput}
              returnKeyType="next"
              textContent={t("loginMobileNumber")}
              textStyle={styles.titleRow}
              inputValue={phone}
              onChangeText={this._updatePhone}
              onSubmitEditing={this._focusNotes}
            />
            <LabelTextInput
              blurOnSubmit={true}
              placeholder={t("notesPlaceholder")}
              multiline={true}
              numberOfLines={3}
              ref={this._notesInput}
              returnKeyType="done"
              textContent={t("notes")}
              textStyle={styles.titleRow}
              inputValue={notes}
              onChangeText={this._updateNotes}
            />
          </ScrollView>
          <Button
            enabled={!!lastName && !!firstName && !!phone}
            label={t("login")}
            primary={true}
            style={
              this.state.keyboardOpen ? styles.keyboardButton : styles.button
            }
            onPress={this._login}
          />
        </KeyboardAvoidingView>
        <PhoneLoginVerification
          phone={this.state.phone || ""}
          visible={this.state.showConfirmation}
          onDismiss={this._onConfirmationDismssed}
        />
      </Fragment>
    );
  }
}

export default connect((state: StoreState) => ({
  healthWorkerInfo: state.meta.healthWorkerInfo,
}))(withNamespaces("login")(Login));

const styles = StyleSheet.create({
  button: {
    alignSelf: "center",
    marginVertical: GUTTER / 2,
  },
  keyboardButton: {
    borderRadius: 0,
    borderWidth: 0,
    marginBottom: 0,
    width: "100%",
  },
  container: {
    flex: 1,
  },
  content: {
    padding: GUTTER,
  },
  titleRow: {
    color: FONT_COLOR,
    fontFamily: FONT_ROBO_MEDIUM,
    fontSize: REGULAR_TEXT,
    paddingTop: GUTTER,
    paddingBottom: GUTTER / 4,
  },
});
