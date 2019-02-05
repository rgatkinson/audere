// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  KeyboardAvoidingView,
  Text as SystemText,
  View,
  ScrollView,
  StyleSheet,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { format } from "date-fns";
import CheckBox from "react-native-check-box";
import KeyboardListener from "react-native-keyboard-listener";
import { ConsentInfo, ConsentInfoSignerType } from "audere-lib";
import { Action, StoreState, setConsent, setEmail, setName } from "../store";
import reduxWriter, { ReduxWriterProps } from "../store/ReduxWriter";
import { AddressConfig, ConsentConfig } from "../resources/ScreenConfig";
import Button from "./components/Button";
import EmailInput from "./components/EmailInput";
import Screen from "./components/Screen";
import Text from "./components/Text";
import TextInput from "./components/TextInput";

interface Props {
  email?: string;
  name?: string;
  navigation: NavigationScreenProp<any, any>;
  dispatch(action: Action): void;
}

interface State {
  email?: string;
  keyboardOpen?: boolean;
  name?: string;
  validEmail: boolean;
}

@connect((state: StoreState) => ({
  email: state.form.email,
  name: state.form.name,
}))
class ConsentScreen extends React.PureComponent<
  Props & WithNamespaces & ReduxWriterProps,
  State
> {
  constructor(props: Props & WithNamespaces & ReduxWriterProps) {
    super(props);
    this.state = {
      email: props.email,
      keyboardOpen: true,
      name: props.name,
      validEmail: !!props.email,
    };
  }

  _canProceed = (): boolean => {
    return (
      !!this.state.name &&
      (!this.props.getAnswer("booleanInput") ||
        (!!this.state.email && this.state.validEmail))
    );
  };

  _onNext = () => {
    const { t } = this.props;
    this.props.dispatch(setName(this.state.name!));
    this.props.dispatch(
      setConsent({
        name: this.state.name!,
        terms: t("consentFormHeader") + "\n" + t("consentFormText"),
        signerType: ConsentInfoSignerType.Subject,
        date: format(new Date(), "YYYY-MM-DD"), // FHIR:date
        signature: "",
      })
    );
    if (this.props.getAnswer("booleanInput")) {
      this.props.dispatch(setEmail(this.state.email!));
    }
    this.props.navigation.push("Address", { data: AddressConfig });
  };

  render() {
    const { t } = this.props;
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" enabled>
        <KeyboardListener
          onWillShow={() => {
            this.setState({ keyboardOpen: true });
          }}
          onWillHide={() => {
            this.setState({ keyboardOpen: false });
          }}
        />
        <Screen
          canProceed={this._canProceed()}
          centerDesc={true}
          desc={t("description")}
          logo={false}
          navBar={true}
          navigation={this.props.navigation}
          skipButton={true}
          step={3}
          title={t("consent")}
          onNext={this._onNext}
        >
          <View style={styles.scrollContainer}>
            <ScrollView>
              <Text
                center={true}
                content={t("consentFormHeader")}
                style={styles.smallText}
              />
              <Text content={t("consentFormText")} style={styles.smallText} />
              <View style={styles.control}>
                <Text
                  content={
                    t("todaysDate") + ": " + new Date().toLocaleDateString()
                  }
                />
                <TextInput
                  autoCapitalize="words"
                  autoCorrect={false}
                  placeholder={
                    t("name") + (this.state.keyboardOpen ? "" : t("required"))
                  }
                  placeholderTextColor={
                    this.state.keyboardOpen ? undefined : "red"
                  }
                  returnKeyType={"next"}
                  value={this.state.name}
                  onChangeText={name => this.setState({ name })}
                  onSubmitEditing={() => {}}
                />
                <SystemText style={styles.signatureBox}>
                  <Text content={t("eSignature") + "\n\n"} />
                  <SystemText
                    style={
                      !!this.state.name
                        ? styles.signature
                        : styles.sigPlaceholder
                    }
                  >
                    {!!this.state.name ? this.state.name : t("sigPlaceholder")}
                  </SystemText>
                </SystemText>
                <Text content={t("disclaimer")} style={styles.smallText} />
                <CheckBox
                  isChecked={!!this.props.getAnswer("booleanInput")}
                  rightTextView={
                    <Text content={t("surveyTitle:" + ConsentConfig.title)} />
                  }
                  style={{ alignSelf: "flex-start" }}
                  onClick={() => {
                    this.props.updateAnswer({
                      booleanInput: !this.props.getAnswer("booleanInput"),
                    });
                  }}
                />
                {!!this.props.getAnswer("booleanInput") && (
                  <EmailInput
                    autoFocus={true}
                    placeholder={t("emailAddress")}
                    returnKeyType="next"
                    validationError={t("validationError")}
                    value={this.state.email}
                    onChange={(email, validEmail) =>
                      this.setState({ email, validEmail })
                    }
                    onSubmit={validEmail => this.setState({ validEmail })}
                  />
                )}
              </View>
              <View style={styles.buttonContainer}>
                <Button
                  enabled={true}
                  fontSize={17}
                  label={t("noThanks")}
                  primary={true}
                  style={styles.button}
                  onPress={() => {
                    this.props.navigation.popToTop();
                  }}
                />
                <Button
                  enabled={this._canProceed()}
                  fontSize={17}
                  label={t("accept")}
                  primary={true}
                  style={styles.button}
                  onPress={this._onNext}
                />
              </View>
            </ScrollView>
          </View>
        </Screen>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    width: 165,
  },
  buttonContainer: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
  },
  smallText: {
    fontSize: 12,
  },
  control: {
    alignItems: "center",
  },
  scrollContainer: {
    borderTopColor: "#bbb",
    borderTopWidth: StyleSheet.hairlineWidth,
    flex: 1,
    marginTop: 10,
    paddingTop: 10,
  },
  signatureBox: {
    alignSelf: "stretch",
    backgroundColor: "white",
    borderColor: "#d6d7da",
    borderRadius: 2,
    borderWidth: 2,
    height: 100,
    overflow: "hidden",
    padding: 10,
  },
  sigPlaceholder: {
    fontStyle: "italic",
  },
  signature: {
    fontFamily: "DancingScript-Regular",
    fontSize: 24,
  },
});

export default reduxWriter(withNamespaces("consentScreen")(ConsentScreen));
