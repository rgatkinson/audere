// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { KeyboardAvoidingView, View, StyleSheet } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { format } from "date-fns";
import ButtonRow from "./components/ButtonRow";
import CheckBox from "react-native-check-box";
import KeyboardListener from "react-native-keyboard-listener";
import { Action, StoreState, setConsent, setEmail } from "../store";
import reduxWriter, { ReduxWriterProps } from "../store/ReduxWriter";
import { AddressConfig, ConsentConfig } from "../resources/ScreenConfig";
import EmailInput from "./components/EmailInput";
import Screen from "./components/Screen";
import Text from "./components/Text";
import { BORDER_COLOR, ERROR_COLOR, GUTTER, SMALL_TEXT } from "./styles";

interface Props {
  email?: string;
  navigation: NavigationScreenProp<any, any>;
  dispatch(action: Action): void;
}

interface State {
  email?: string;
  keyboardOpen?: boolean;
  validEmail: boolean;
}

@connect((state: StoreState) => ({
  email: state.survey.email,
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
      validEmail: !!props.email,
    };
  }

  _canProceed = (): boolean => {
    return (
      !this.props.getAnswer("booleanInput") ||
      (!!this.state.email && this.state.validEmail)
    );
  };

  _onNext = () => {
    const { t } = this.props;
    if (this.props.getAnswer("booleanInput")) {
      this.props.dispatch(setEmail(this.state.email!));
    }
    this.props.navigation.push("Address", { data: AddressConfig });
  };

  render() {
    const { t } = this.props;
    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
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
          navBar={true}
          navigation={this.props.navigation}
          skipButton={true}
          step={3}
          title={t("consent")}
          onNext={this._onNext}
        >
          <Text
            center={true}
            content={t("consentFormHeader")}
            style={styles.smallText}
          />
          <Text content={t("consentFormText")} style={styles.smallText} />
          <CheckBox
            isChecked={!!this.props.getAnswer("booleanInput")}
            rightTextView={
              <Text
                content={t("surveyTitle:" + ConsentConfig.title)}
                style={{ paddingLeft: GUTTER / 4 }}
              />
            }
            style={{ alignSelf: "stretch", marginVertical: GUTTER }}
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
          <ButtonRow
            firstLabel={t("noThanks")}
            firstOnPress={() => {
              this.props.navigation.push("ConsentIneligible");
            }}
            secondEnabled={this._canProceed()}
            secondLabel={t("accept")}
            secondOnPress={this._onNext}
          />
        </Screen>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  smallText: {
    fontSize: SMALL_TEXT,
  },
});

export default reduxWriter(withNamespaces("consentScreen")(ConsentScreen));
