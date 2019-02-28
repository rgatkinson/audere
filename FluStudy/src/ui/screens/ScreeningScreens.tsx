// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { format } from "date-fns";
import React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  PushNotificationIOS,
  View,
  StyleSheet,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import KeyboardListener from "react-native-keyboard-listener";
import CheckBox from "react-native-check-box";
import {
  EventInfoKind,
  PushNotificationState,
  PushRegistrationError,
  WorkflowInfo,
  ConsentInfoSignerType,
} from "audere-lib/feverProtocol";
import {
  Action,
  Address,
  Option,
  StoreState,
  SurveyResponse,
  setEmail,
  setPushNotificationState,
  setWorkflow,
  setConsent,
} from "../../store";
import {
  AddressConfig,
  AgeBuckets,
  AgeConfig,
  ButtonConfig,
  ConsentConfig,
  SymptomsConfig,
} from "../../resources/ScreenConfig";
import reduxWriter, { ReduxWriterProps } from "../../store/ReduxWriter";
import AddressInput from "../components/AddressInput";
import Button from "../components/Button";
import ButtonRow from "../components/ButtonRow";
import Divider from "../components/Divider";
import EmailInput from "../components/EmailInput";
import Screen from "../components/Screen";
import Links from "../components/Links";
import OptionList, { newSelectedOptionsList } from "../components/OptionList";
import Text from "../components/Text";
import { findMedHelp, learnMore } from "../externalActions";
import { GUTTER, SECONDARY_COLOR, SMALL_TEXT } from "../styles";
import { timestampRender, timestampInteraction } from "./analytics";
import { isValidUSZipCode } from "../../util/check";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

@connect()
class WelcomeScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender(
      "WelcomeScreen",
      <Screen
        canProceed={true}
        desc={t("description")}
        hideBackButton={true}
        navigation={this.props.navigation}
        imageAspectRatio={1.75}
        stableImageSrc={require("../../img/welcome.png")}
        title={t("welcome")}
        onNext={() => {
          this.props.navigation.push("Why");
        }}
      />
    );
  }
}
export const Welcome = withNamespaces("welcomeScreen")<Props>(WelcomeScreen);

class WhyScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender(
      "WhyScreen",
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={require("../../img/why.png")}
        navigation={this.props.navigation}
        title={t("why")}
        onNext={() => {
          this.props.navigation.push("What");
        }}
      />
    );
  }
}
export const Why = withNamespaces("whyScreen")<Props>(WhyScreen);

class WhatScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender(
      "WhatScreen",
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={require("../../img/what.png")}
        navigation={this.props.navigation}
        title={t("what")}
        onNext={() => {
          this.props.navigation.push("Age");
        }}
      />
    );
  }
}
export const What = withNamespaces("whatScreen")<Props>(WhatScreen);

class AgeScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  _onNext = (
    ageBucket: string = this.props.getAnswer("selectedButtonKey", AgeConfig.id)
  ) => {
    if (ageBucket === AgeBuckets.Under18) {
      this.props.navigation.push("AgeIneligible");
    } else {
      this.props.navigation.push("Symptoms");
    }
  };

  render() {
    const { t } = this.props;
    return timestampRender(
      "AgeScreen",
      <Screen
        canProceed={!!this.props.getAnswer("selectedButtonKey", AgeConfig.id)}
        navigation={this.props.navigation}
        skipButton={true}
        step={1}
        title={t("surveyTitle:" + AgeConfig.title)}
        onNext={this._onNext}
      >
        <View style={{ marginTop: GUTTER }} />
        {AgeConfig.buttons.map((button: ButtonConfig) => (
          <Button
            enabled={true}
            key={button.key}
            label={t("surveyButton:" + button.key)}
            primary={true}
            onPress={() => {
              timestampInteraction("AgeScreen." + button.key);
              this.props.updateAnswer(
                { selectedButtonKey: button.key },
                AgeConfig
              );
              this._onNext(button.key);
            }}
          />
        ))}
      </Screen>
    );
  }
}
export const Age = reduxWriter(withNamespaces("ageScreen")(AgeScreen));

class SymptomsScreen extends React.PureComponent<
  Props & WithNamespaces & ReduxWriterProps
> {
  _onNext = () => {
    const { t } = this.props;
    if (this._numSymptoms() > 1 && this._haveCough()) {
      Alert.alert(t("thankYou"), t("nextStep"), [
        {
          text: t("noThanks"),
          onPress: () => {
            this.props.navigation.push("ConsentIneligible");
          },
        },
        {
          text: t("viewConsent"),
          onPress: () => {
            this.props.navigation.push("Consent");
          },
        },
      ]);
    } else {
      this.props.navigation.push("SymptomsIneligible");
    }
  };

  _haveOption = () => {
    const symptoms: Option[] = this.props.getAnswer(
      "options",
      SymptomsConfig.id
    );
    return symptoms
      ? symptoms.reduce(
          (result: boolean, option: Option) => result || option.selected,
          false
        )
      : false;
  };

  _numSymptoms = () => {
    const symptoms: Option[] = this.props.getAnswer(
      "options",
      SymptomsConfig.id
    );
    return symptoms
      ? symptoms.reduce(
          (count: number, option: Option) =>
            option.selected && option.key !== "noneOfTheAbove"
              ? count + 1
              : count,
          0
        )
      : 0;
  };

  _haveCough = () => {
    const symptoms: Option[] = this.props.getAnswer(
      "options",
      SymptomsConfig.id
    );
    return symptoms
      ? symptoms.reduce(
          (result: boolean, option: Option) =>
            option.selected && option.key === "cough" ? true : result,
          false
        )
      : false;
  };

  render() {
    const { t } = this.props;
    return timestampRender(
      "SymptomsScreen",
      <Screen
        canProceed={this._haveOption()}
        centerDesc={true}
        desc={t("surveyDescription:" + SymptomsConfig.description)}
        navigation={this.props.navigation}
        step={2}
        title={t("surveyTitle:" + SymptomsConfig.title)}
        onNext={this._onNext}
      >
        <OptionList
          data={newSelectedOptionsList(
            SymptomsConfig.optionList!.options,
            this.props.getAnswer("options", SymptomsConfig.id)
          )}
          multiSelect={true}
          numColumns={1}
          exclusiveOptions={["noneOfTheAbove"]}
          onChange={symptoms =>
            this.props.updateAnswer({ options: symptoms }, SymptomsConfig)
          }
        />
      </Screen>
    );
  }
}
export const Symptoms = reduxWriter(
  withNamespaces("symptomsScreen")(SymptomsScreen)
);

interface ConsentProps {
  email?: string;
}

interface ConsentState {
  email?: string;
  keyboardOpen?: boolean;
}

@connect((state: StoreState) => ({
  email: state.survey.email,
}))
class ConsentScreen extends React.PureComponent<
  Props & ConsentProps & WithNamespaces & ReduxWriterProps,
  ConsentState
> {
  constructor(props: Props & ConsentProps & WithNamespaces & ReduxWriterProps) {
    super(props);
    this.state = {
      email: props.email,
      keyboardOpen: true,
    };
  }

  _canProceed = (): boolean => {
    return (
      !this.props.getAnswer("booleanInput", ConsentConfig.id) ||
      (!!this.state.email &&
        this.emailInput.current != null &&
        this.emailInput.current!.isValid(this.state.email))
    );
  };

  _onNext = () => {
    const { t } = this.props;
    if (this.props.getAnswer("booleanInput", ConsentConfig.id)) {
      this.props.dispatch(setEmail(this.state.email!));
    }
    this.props.dispatch(
      setConsent({
        terms: t("consentFormText"),
        signerType: ConsentInfoSignerType.Subject,
        date: format(new Date(), "YYYY-MM-DD"),
      })
    );
    this.props.navigation.push("Address");
  };

  emailInput = React.createRef<EmailInput>();

  render() {
    const { t } = this.props;
    return timestampRender(
      "ConsentScreen",
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
          navigation={this.props.navigation}
          skipButton={true}
          step={3}
          title={t("consent")}
          onNext={this._onNext}
        >
          <Divider />
          <Text
            center={true}
            content={t("consentFormHeader")}
            style={{ fontSize: SMALL_TEXT }}
          />
          <Text
            content={t("consentFormText")}
            style={{ fontSize: SMALL_TEXT }}
          />
          <CheckBox
            isChecked={!!this.props.getAnswer("booleanInput", ConsentConfig.id)}
            rightTextView={
              <Text
                content={t("surveyTitle:" + ConsentConfig.title)}
                style={{
                  alignSelf: "center",
                  fontSize: SMALL_TEXT,
                  paddingLeft: GUTTER / 4,
                }}
              />
            }
            style={{ alignSelf: "stretch", marginVertical: GUTTER }}
            onClick={() => {
              this.props.updateAnswer(
                {
                  booleanInput: !this.props.getAnswer(
                    "booleanInput",
                    ConsentConfig.id
                  ),
                },
                ConsentConfig
              );
            }}
          />
          {!!this.props.getAnswer("booleanInput", ConsentConfig.id) && (
            <View style={{ flex: 1 }}>
              <EmailInput
                autoFocus={true}
                placeholder={t("emailAddress")}
                ref={this.emailInput}
                returnKeyType="next"
                validationError={t("validationError")}
                value={this.state.email}
                onChange={email => this.setState({ email })}
              />
              <Text
                content={t("privacyNotice")}
                style={{ fontSize: SMALL_TEXT, marginBottom: GUTTER }}
              />
            </View>
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
export const Consent = reduxWriter(
  withNamespaces("consentScreen")(ConsentScreen)
);

class ConsentIneligibleScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender(
      "ConsentIneligibleScreen",
      <Screen
        canProceed={false}
        footer={
          <Button
            enabled={true}
            primary={true}
            label={t("back")}
            onPress={() => this.props.navigation.pop()}
          />
        }
        imageSrc={require("../../img/consentIneligible.png")}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("ineligible")}
        desc={t("description")}
        onNext={() => {}}
      />
    );
  }
}
export const ConsentIneligible = withNamespaces("consentIneligibleScreen")<
  Props
>(ConsentIneligibleScreen);

interface WorkflowProps {
  workflow: WorkflowInfo;
}

interface AddressState {
  address?: Address;
}

@connect((state: StoreState) => ({
  workflow: state.survey.workflow,
}))
class AddressInputScreen extends React.Component<
  Props & WorkflowProps & WithNamespaces & ReduxWriterProps,
  AddressState
> {
  constructor(
    props: Props & WorkflowProps & WithNamespaces & ReduxWriterProps
  ) {
    super(props);
    this.state = {
      address: props.getAnswer("addressInput", AddressConfig.id),
    };
  }

  _onNext = () => {
    if (this._haveValidAddress) {
      this.props.updateAnswer(
        { addressInput: this.state.address },
        AddressConfig
      );
      this.props.dispatch(
        setWorkflow({
          ...this.props.workflow,
          screeningCompletedAt: new Date().toISOString(),
        })
      );
      this.props.navigation.push("Confirmation");
    }
  };

  _haveValidAddress = (): boolean => {
    const address = this.state.address;
    return (
      !!address &&
      !!address.name &&
      !!address.address &&
      !!address.city &&
      !!address.state &&
      isValidUSZipCode(address.zipcode)
    );
  };

  render() {
    const { t } = this.props;
    return timestampRender(
      "AddressInputScreen",
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" enabled>
        <Screen
          buttonLabel={t("common:button:submit")}
          canProceed={this._haveValidAddress()}
          centerDesc={true}
          desc={t("surveyDescription:" + AddressConfig.description)}
          navigation={this.props.navigation}
          step={4}
          title={t("surveyTitle:" + AddressConfig.title)}
          onNext={this._onNext}
        >
          <AddressInput
            value={this.state.address}
            onChange={(address: Address) => this.setState({ address })}
          />
          <Text
            content={t("addressExceptions")}
            style={{ fontSize: SMALL_TEXT }}
          />
        </Screen>
      </KeyboardAvoidingView>
    );
  }
}
export const AddressScreen = reduxWriter(
  withNamespaces("addressScreen")(AddressInputScreen)
);

class AgeIneligibleScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender(
      "AgeIneligibleScreen",
      <Screen
        canProceed={false}
        desc={t("description")}
        hideBackButton={true}
        imageSrc={require("../../img/ineligible.png")}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("ineligible")}
        onNext={() => this.props.navigation.popToTop()}
      >
        <Links
          links={[
            {
              label: t("links:learnLink"),
              onPress: () => {
                timestampInteraction("AgeIneligibleScreen.links:learnLink");
                learnMore();
              },
            },
            {
              label: t("links:medLink"),
              onPress: () => {
                timestampInteraction("AgeIneligibleScreen.links:medLink");
                findMedHelp();
              },
            },
          ]}
        />
      </Screen>
    );
  }
}
export const AgeIneligible = withNamespaces("ageIneligibleScreen")<Props>(
  AgeIneligibleScreen
);

class SymptomsIneligibleScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender(
      "SymptomsIneligibleScreen",
      <Screen
        canProceed={false}
        desc={t("description")}
        hideBackButton={true}
        imageSrc={require("../../img/ineligible.png")}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("ineligible")}
        onNext={() => this.props.navigation.popToTop()}
      >
        <Links
          links={[
            {
              label: t("links:learnLink"),
              onPress: () => {
                timestampInteraction(
                  "SymptomsIneligibleScreen.links:learnLink"
                );
                learnMore();
              },
            },
            {
              label: t("links:medLink"),
              onPress: () => {
                timestampInteraction("SymptomsIneligibleScreen.links:medLink");
                findMedHelp();
              },
            },
          ]}
        />
        <Text
          content={t("disclaimer")}
          style={{
            alignSelf: "stretch",
            fontSize: SMALL_TEXT,
            marginBottom: GUTTER,
          }}
        />
      </Screen>
    );
  }
}
export const SymptomsIneligible = withNamespaces("symptomsIneligibleScreen")<
  Props
>(SymptomsIneligibleScreen);

interface PushProps {
  pushState: PushNotificationState;
}

@connect((state: StoreState) => ({
  pushState: state.survey.pushState,
}))
class ConfirmationScreen extends React.Component<
  Props & PushProps & WithNamespaces
> {
  render() {
    const { t } = this.props;
    return timestampRender(
      "ConfirmationScreen",
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={require("../../img/confirmation.png")}
        navigation={this.props.navigation}
        title={t("confirmed")}
        onNext={() => {
          this.props.navigation.push("ExtraInfo");
          /*
           * Not asking about push notifications yet
          if (this.props.pushState.showedSystemPrompt) {
            this.props.navigation.push("ExtraInfo");
          } else {
            this.props.navigation.push("PushNotifications");
          }
          */
        }}
      />
    );
  }
}
export const Confirmation = withNamespaces("confirmationScreen")<
  Props & PushProps
>(ConfirmationScreen);

@connect((state: StoreState) => ({
  pushState: state.survey.pushState,
}))
class PushNotificationsScreen extends React.Component<
  Props & PushProps & WithNamespaces
> {
  _registrationEvent = (token: string) => {
    const newPushState = { ...this.props.pushState, token };
    this.props.dispatch(setPushNotificationState(newPushState));
    this.props.navigation.push("ExtraInfo");
  };

  _registrationErrorEvent = (result: PushRegistrationError) => {
    const newPushState = { ...this.props.pushState, registrationError: result };
    this.props.dispatch(setPushNotificationState(newPushState));
    this.props.navigation.push("ExtraInfo");
  };

  componentWillMount() {
    PushNotificationIOS.addEventListener("register", this._registrationEvent);
    PushNotificationIOS.addEventListener(
      "registrationError",
      this._registrationErrorEvent
    );
  }

  componentWillUnmount() {
    PushNotificationIOS.removeEventListener(
      "register",
      this._registrationEvent
    );
    PushNotificationIOS.removeEventListener(
      "registrationError",
      this._registrationErrorEvent
    );
  }

  render() {
    const { t } = this.props;
    return timestampRender(
      "PushNotificationsScreen",
      <Screen
        canProceed={false}
        desc={t("description")}
        footer={
          <ButtonRow
            firstLabel={t("common:button:no")}
            firstOnPress={() => {
              timestampInteraction("PushNotificationsScreen.NoButton");
              const newPushState = {
                ...this.props.pushState,
                softResponse: false,
              };
              this.props.dispatch(setPushNotificationState(newPushState));
              this.props.navigation.push("ExtraInfo");
            }}
            secondEnabled={true}
            secondLabel={t("common:button:yes")}
            secondOnPress={() => {
              timestampInteraction("PushNotificationsScreen.YesButton");
              if (this.props.pushState.showedSystemPrompt) {
                this.props.navigation.push("ExtraInfo");
              } else {
                const newPushState = {
                  ...this.props.pushState,
                  softResponse: true,
                  showedSystemPrompt: true,
                };
                this.props.dispatch(setPushNotificationState(newPushState));
                PushNotificationIOS.requestPermissions();
              }
            }}
          />
        }
        imageSrc={require("../../img/pushNotifications.png")}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("pushNotifications")}
        onNext={() => {}}
      />
    );
  }
}
export const PushNotifications = withNamespaces("pushNotificationsScreen")<
  Props & PushProps
>(PushNotificationsScreen);

class InstructionsScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender(
      "InstructionsScreen",
      <Screen
        canProceed={false}
        desc={t("description")}
        imageSrc={require("../../img/instructions.png")}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("instructions")}
        onNext={() => {}}
      />
    );
  }
}
export const Instructions = withNamespaces("instructionsScreen")<Props>(
  InstructionsScreen
);

class ExtraInfoScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender(
      "ExtraInfoScreen",
      <Screen
        canProceed={true}
        imageSrc={require("../../img/extraInfo.png")}
        navigation={this.props.navigation}
        title={t("extraInfo")}
        onNext={() => {
          this.props.navigation.push("Instructions");
        }}
      >
        <View style={{ marginTop: GUTTER }} />
        <Links
          links={[
            {
              label: t("links:learnLink"),
              onPress: () => {
                timestampInteraction("ExtraInfoScreen.links:learnLink");
                learnMore();
              },
            },
            {
              label: t("links:medLink"),
              onPress: () => {
                timestampInteraction("ExtraInfoScreen.links:medLink");
                findMedHelp();
              },
            },
          ]}
        />
      </Screen>
    );
  }
}
export const ExtraInfo = withNamespaces("extraInfoScreen")<Props>(
  ExtraInfoScreen
);
