// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { format } from "date-fns";
import React from "react";
import { KeyboardAvoidingView, PushNotificationIOS, View } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import CheckBox from "react-native-check-box";
import {
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
import Divider from "../components/Divider";
import EmailInput from "../components/EmailInput";
import Screen from "../components/Screen";
import Links from "../components/Links";
import OptionList, { newSelectedOptionsList } from "../components/OptionList";
import Text from "../components/Text";
import { findMedHelp, learnMore } from "../externalActions";
import { GUTTER, SMALL_TEXT } from "../styles";
import { timestampRender, timestampInteraction } from "./analytics";
import { isValidUSZipCode, isNotEmptyString } from "../../util/check";
import { DEVICE_INFO } from "../../transport/DeviceInfo";
import { tracker, FunnelEvents } from "../../util/tracker";

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
        stableImageSrc={require("../../img/whyThisStudy.png")}
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
        stableImageSrc={require("../../img/whatDoIDoNext.png")}
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
      this.props.navigation.push("Consent");
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
    };
  }

  componentDidMount() {
    tracker.logEvent(FunnelEvents.MET_SYMPTOMS);
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
        terms:
          t("consentFormHeader1") +
          "\n" +
          t("consentFormHeader2") +
          "\n" +
          t("consentFormText"),
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
        <Screen
          buttonLabel={t("accept")}
          canProceed={this._canProceed()}
          centerDesc={true}
          desc={t("description")}
          footer={
            <Button
              enabled={true}
              primary={false}
              label={t("noThanks")}
              onPress={() => this.props.navigation.push("ConsentIneligible")}
            />
          }
          navigation={this.props.navigation}
          step={3}
          title={t("consent")}
          onNext={this._onNext}
        >
          <Divider
            style={{ borderBottomColor: "#444", borderBottomWidth: 1 }}
          />
          <Text
            center={true}
            content={t("consentFormHeader1")}
            style={{ fontSize: SMALL_TEXT }}
          />
          <Divider
            style={{
              borderBottomColor: "#666",
              width: "90%",
              alignSelf: "center",
            }}
          />
          <Text
            center={true}
            content={t("consentFormHeader2")}
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
                autoFocus={this.props.navigation.isFocused()}
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
        </Screen>
      </KeyboardAvoidingView>
    );
  }
}
export const Consent = reduxWriter(
  withNamespaces("consentScreen")(ConsentScreen)
);

class ConsentIneligibleScreen extends React.Component<Props & WithNamespaces> {
  componentDidMount() {
    tracker.logEvent(FunnelEvents.DECLINED_CONSENT);
  }

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
        imageSrc={require("../../img/thanksForYourInterest.png")}
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
    const { address } = this.state;
    return (
      !!address &&
      isNotEmptyString(address.firstName) &&
      isNotEmptyString(address.lastName) &&
      isNotEmptyString(address.address) &&
      isNotEmptyString(address.city) &&
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
            autoFocus={this.props.navigation.isFocused()}
            value={this.state.address}
            onChange={(address: Address) => this.setState({ address })}
          />
          <Text
            content={t("addressExceptions")}
            style={{ fontSize: SMALL_TEXT, marginBottom: GUTTER }}
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
  componentDidMount() {
    tracker.logEvent(FunnelEvents.AGE_INELIGIBLE);
  }

  render() {
    const { t } = this.props;
    return timestampRender(
      "AgeIneligibleScreen",
      <Screen
        canProceed={false}
        desc={t("description")}
        hideBackButton={true}
        imageSrc={require("../../img/thanksForYourInterest.png")}
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
  componentDidMount() {
    tracker.logEvent(FunnelEvents.SYMPTOMS_INELIGIBLE);
  }

  render() {
    const { t } = this.props;
    return timestampRender(
      "SymptomsIneligibleScreen",
      <Screen
        canProceed={false}
        desc={t("description")}
        hideBackButton={true}
        imageSrc={require("../../img/thanksForYourInterest.png")}
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
  componentDidMount() {
    tracker.logEvent(FunnelEvents.ADDRESS_COMPLETED);
  }

  render() {
    const { t } = this.props;
    return timestampRender(
      "ConfirmationScreen",
      <Screen
        canProceed={true}
        desc={t("description", {
          device: t("common:device:" + DEVICE_INFO.idiomText),
        })}
        imageSrc={require("../../img/fluKitOrdered.png")}
        navigation={this.props.navigation}
        skipButton={true}
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
      >
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
        buttonLabel={t("common:button:yes")}
        canProceed={true}
        desc={t("description")}
        footer={
          <Button
            enabled={true}
            primary={false}
            label={t("common:button:no")}
            onPress={() => {
              timestampInteraction("PushNotificationsScreen.NoButton");
              const newPushState = {
                ...this.props.pushState,
                softResponse: false,
              };
              this.props.dispatch(setPushNotificationState(newPushState));
              this.props.navigation.push("ExtraInfo");
            }}
          />
        }
        imageSrc={require("../../img/pushNotifications.png")}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("pushNotifications")}
        onNext={() => {
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
    );
  }
}
export const PushNotifications = withNamespaces("pushNotificationsScreen")<
  Props & PushProps
>(PushNotificationsScreen);
