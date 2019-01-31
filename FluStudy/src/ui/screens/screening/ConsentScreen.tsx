// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Text as SystemText, View, ScrollView, StyleSheet } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { format } from "date-fns";
import KeyboardListener from "react-native-keyboard-listener";
import { Action, StoreState, setConsent, setName } from "../../../store";
import { ConsentInfo, ConsentInfoSignerType } from "audere-lib";
import { AddressConfig } from "../../../resources/ScreenConfig";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import NavigationBar from "../../components/NavigationBar";
import ScreenContainer from "../../components/ScreenContainer";
import Step from "../../components/Step";
import Text from "../../components/Text";
import TextInput from "../../components/TextInput";
import Title from "../../components/Title";

interface Props {
  name?: string;
  navigation: NavigationScreenProp<any, any>;
  dispatch(action: Action): void;
}

interface State {
  keyboardOpen?: boolean;
  name?: string;
}

@connect((state: StoreState) => ({
  name: state.form.name,
}))
class ConsentScreen extends React.PureComponent<Props & WithNamespaces, State> {
  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = {
      name: props.name,
    };
  }

  _onNext = () => {
    const { t } = this.props;
    const name = this.state.name;
    if (name != null) {
      this.props.dispatch(setName(name));
      this.props.dispatch(
        setConsent({
          name: name,
          terms: t("consentFormHeader") + "\n" + t("consentFormText"),
          signerType: ConsentInfoSignerType.Subject,
          date: format(new Date(), "YYYY-MM-DD"), // FHIR:date
          signature: "",
        })
      );
      this.props.navigation.push("Address", { data: AddressConfig });
    }
  };

  render() {
    const { t } = this.props;
    return (
      <View style={{ flex: 1 }}>
        <KeyboardListener
          onWillShow={() => {
            this.setState({ keyboardOpen: true });
          }}
          onWillHide={() => {
            this.setState({ keyboardOpen: false });
          }}
        />
        <NavigationBar
          canProceed={false}
          navigation={this.props.navigation}
          onNext={() => {}}
        />
        <Step step={3} totalSteps={5} />
        <View style={{ padding: 8 }}>
          <Title label={t("consent")} />
          <Text content={t("description")} center={true} />
        </View>
        <View style={{ flex: 1 }}>
          <ScrollView>
            <Text
              center={true}
              content={t("consentFormHeader")}
              style={styles.consentText}
            />
            <Text content={t("consentFormText")} style={styles.consentText} />
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
                    !!this.state.name ? styles.signature : styles.sigPlaceholder
                  }
                >
                  {!!this.state.name ? this.state.name : t("sigPlaceholder")}
                </SystemText>
              </SystemText>
              <Text content={t("disclaimer")} />
              <Button
                enabled={true}
                primary={true}
                label={t("noThanks")}
                onPress={() => {
                  this.props.navigation.popToTop();
                }}
              />
              <Button
                enabled={true}
                primary={true}
                label={t("accept")}
                onPress={this._onNext}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  consentText: {
    backgroundColor: "white",
    fontSize: 14,
    marginVertical: 0,
    padding: 16,
  },
  control: {
    alignItems: "center",
    padding: 20,
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

export default withNamespaces("consentScreen")(ConsentScreen);
