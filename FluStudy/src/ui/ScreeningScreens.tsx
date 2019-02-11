import React from "react";
import { Alert, PushNotificationIOS, View, StyleSheet } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  EventInfoKind,
  PushNotificationState,
  PushRegistrationError,
} from "audere-lib/feverProtocol";
import {
  Action,
  Address,
  Option,
  StoreState,
  SurveyResponse,
  appendEvent,
  setPushNotificationState,
} from "../store";
import {
  AddressConfig,
  AgeConfig,
  ButtonConfig,
  ConsentConfig,
  SymptomsConfig,
} from "../resources/ScreenConfig";
import reduxWriter, { ReduxWriterProps } from "../store/ReduxWriter";
import AddressInput from "./components/AddressInput";
import Button from "./components/Button";
import ButtonRow from "./components/ButtonRow";
import Screen from "./components/Screen";
import Links from "./components/Links";
import OptionList, { newSelectedOptionsList } from "./components/OptionList";
import Text from "./components/Text";
import { GUTTER, SECONDARY_COLOR } from "./styles";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

@connect()
class WelcomeScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={require("../img/welcome.png")}
        logo={true}
        navBar={false}
        navigation={this.props.navigation}
        title={t("welcome")}
        onNext={() => {
          this.props.dispatch(
            appendEvent(EventInfoKind.Screening, "StartedScreening")
          );
          this.props.navigation.push("Why");
        }}
      />
    );
  }
}
const Welcome = withNamespaces("welcomeScreen")<Props>(WelcomeScreen);

class WhyScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={require("../img/why.png")}
        logo={true}
        navBar={false}
        navigation={this.props.navigation}
        title={t("why")}
        onNext={() => {
          this.props.navigation.push("What");
        }}
      />
    );
  }
}
const Why = withNamespaces("whyScreen")<Props>(WhyScreen);

class WhatScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={require("../img/what.png")}
        logo={true}
        navBar={false}
        navigation={this.props.navigation}
        title={t("what")}
        onNext={() => {
          this.props.navigation.push("Age", { data: AgeConfig });
        }}
      />
    );
  }
}
const What = withNamespaces("whatScreen")<Props>(WhatScreen);

class AgeScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  _onNext = () => {
    this.props.navigation.push("Symptoms", { data: SymptomsConfig });
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={!!this.props.getAnswer("selectedButtonKey")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        skipButton={true}
        step={1}
        title={t("surveyTitle:" + AgeConfig.title)}
        onNext={this._onNext}
      >
        {AgeConfig.buttons.map((button: ButtonConfig) => (
          <Button
            checked={this.props.getAnswer("selectedButtonKey") === button.key}
            enabled={true}
            key={button.key}
            label={t("surveyButton:" + button.key)}
            primary={button.primary}
            style={{ marginVertical: GUTTER }}
            onPress={() => {
              this.props.updateAnswer({ selectedButtonKey: button.key });
              this._onNext();
            }}
          />
        ))}
      </Screen>
    );
  }
}
const Age = reduxWriter(withNamespaces("ageScreen")(AgeScreen));

class SymptomsScreen extends React.PureComponent<
  Props & WithNamespaces & ReduxWriterProps
> {
  _onNext = () => {
    this.props.updateAnswer({ selectedButtonKey: "next" });
    const { t } = this.props;
    if (this._numSymptoms() > 1) {
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
            this.props.navigation.push("Consent", { data: ConsentConfig });
          },
        },
      ]);
    } else {
      Alert.alert(t("areYouSure"), t("minSymptoms"), [
        {
          text: t("common:button:cancel"),
          onPress: () => {},
        },
        {
          text: t("common:button:continue"),
          onPress: () => {
            this.props.navigation.push("SymptomsIneligible");
          },
        },
      ]);
    }
  };

  _haveOption = () => {
    const symptoms: Option[] = this.props.getAnswer("options");
    return symptoms
      ? symptoms.reduce(
          (result: boolean, option: Option) => result || option.selected,
          false
        )
      : false;
  };

  _numSymptoms = () => {
    const symptoms: Option[] = this.props.getAnswer("options");
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

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={this._haveOption()}
        centerDesc={true}
        desc={t("surveyDescription:" + SymptomsConfig.description!.label)}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        step={2}
        title={t("surveyTitle:" + SymptomsConfig.title)}
        onNext={this._onNext}
      >
        <OptionList
          data={newSelectedOptionsList(
            SymptomsConfig.optionList!.options,
            this.props.getAnswer("options")
          )}
          multiSelect={true}
          numColumns={1}
          exclusiveOption="noneOfTheAbove"
          onChange={symptoms => this.props.updateAnswer({ options: symptoms })}
        />
      </Screen>
    );
  }
}
const Symptoms = reduxWriter(withNamespaces("symptomsScreen")(SymptomsScreen));

class ConsentIneligibleScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
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
        imageSrc={require("../img/ineligible.png")}
        logo={true}
        navBar={true}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("ineligible")}
        desc={t("description")}
        onNext={() => {}}
      />
    );
  }
}
const ConsentIneligible = withNamespaces("consentIneligibleScreen")<Props>(
  ConsentIneligibleScreen
);

interface AddressProps {
  name: string;
}

@connect()
class AddressInputScreen extends React.Component<
  Props & AddressProps & WithNamespaces & ReduxWriterProps
> {
  _onNext = () => {
    if (this._haveValidAddress) {
      this.props.navigation.push("Confirmation");
    }
  };

  _haveValidAddress = (): boolean => {
    const address = this.props.getAnswer("addressInput");
    return (
      !!address &&
      !!address.name &&
      !!address.address &&
      !!address.city &&
      !!address.state &&
      !!address.zipcode
    );
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("common:button:submit")}
        canProceed={this._haveValidAddress()}
        centerDesc={true}
        desc={t("surveyDescription:" + AddressConfig.description!.label)}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        step={4}
        title={t("surveyTitle:" + AddressConfig.title)}
        onNext={this._onNext}
      >
        <AddressInput
          value={this.props.getAnswer("addressInput")}
          onChange={(address: Address) =>
            this.props.updateAnswer({ addressInput: address })
          }
        />
      </Screen>
    );
  }
}
const AddressScreen = reduxWriter(withNamespaces()(AddressInputScreen));

class SymptomsIneligibleScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={false}
        desc={t("description")}
        imageSrc={require("../img/ineligible.png")}
        logo={true}
        navBar={false}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("ineligible")}
        onNext={() => this.props.navigation.popToTop()}
      >
        <Links
          links={[
            {
              label: t("links:shareLink"),
              onPress: () => {
                Alert.alert("Hello", "Waiting on content", [
                  { text: "Ok", onPress: () => {} },
                ]);
              },
            },
            {
              label: t("links:learnLink"),
              onPress: () => {
                Alert.alert("Hello", "Waiting on content", [
                  { text: "Ok", onPress: () => {} },
                ]);
              },
            },
            {
              label: t("links:medLink"),
              onPress: () => {
                Alert.alert("Hello", "Waiting on content", [
                  { text: "Ok", onPress: () => {} },
                ]);
              },
            },
          ]}
        />
        <Text
          content={t("disclaimer")}
          style={{
            alignSelf: "stretch",
            color: SECONDARY_COLOR,
            marginBottom: GUTTER,
          }}
        />
      </Screen>
    );
  }
}
const SymptomsIneligible = withNamespaces("symptomsIneligibleScreen")<Props>(
  SymptomsIneligibleScreen
);

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
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={require("../img/confirmation.png")}
        logo={true}
        navBar={true}
        navigation={this.props.navigation}
        title={t("confirmed")}
        onNext={() => {
          if (this.props.pushState.showedSystemPrompt) {
            this.props.navigation.push("Instructions");
          } else {
            this.props.navigation.push("PushNotifications");
          }
        }}
      />
    );
  }
}
const Confirmation = withNamespaces("confirmationScreen")<Props & PushProps>(
  ConfirmationScreen
);

@connect((state: StoreState) => ({
  pushState: state.survey.pushState,
}))
class PushNotificationsScreen extends React.Component<
  Props & PushProps & WithNamespaces
> {
  _registrationEvent = (token: string) => {
    const newPushState = { ...this.props.pushState, token };
    this.props.dispatch(setPushNotificationState(newPushState));
    this.props.navigation.push("Instructions");
  };

  _registrationErrorEvent = (result: PushRegistrationError) => {
    const newPushState = { ...this.props.pushState, registrationError: result };
    this.props.dispatch(setPushNotificationState(newPushState));
    this.props.navigation.push("Instructions");
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
    return (
      <Screen
        canProceed={false}
        desc={t("description")}
        footer={
          <ButtonRow
            firstLabel={t("common:button:no")}
            firstOnPress={() => {
              const newPushState = {
                ...this.props.pushState,
                softResponse: false,
              };
              this.props.dispatch(setPushNotificationState(newPushState));
              this.props.navigation.push("Instructions");
            }}
            secondEnabled={true}
            secondLabel={t("common:button:yes")}
            secondOnPress={() => {
              if (this.props.pushState.showedSystemPrompt) {
                this.props.navigation.push("Instructions");
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
        imageSrc={require("../img/pushNotifications.png")}
        logo={true}
        navBar={true}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("pushNotifications")}
        onNext={() => {}}
      />
    );
  }
}
const PushNotifications = withNamespaces("pushNotificationsScreen")<
  Props & PushProps
>(PushNotificationsScreen);

class InstructionsScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={require("../img/instructions.png")}
        logo={true}
        navBar={true}
        navigation={this.props.navigation}
        title={t("instructions")}
        onNext={() => {
          this.props.navigation.push("ExtraInfo");
        }}
      />
    );
  }
}
const Instructions = withNamespaces("instructionsScreen")<Props>(
  InstructionsScreen
);

class ExtraInfoScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("close")}
        canProceed={true}
        imageSrc={require("../img/extraInfo.png")}
        logo={true}
        navBar={true}
        navigation={this.props.navigation}
        title={t("extraInfo")}
        onNext={() => {
          this.props.navigation.push("SplashScreen");
        }}
      >
        <Links
          links={[
            {
              label: t("links:shareLink"),
              onPress: () => {
                Alert.alert("Hello", "Waiting on content", [
                  { text: "Ok", onPress: () => {} },
                ]);
              },
            },
            {
              label: t("links:learnLink"),
              onPress: () => {
                Alert.alert("Hello", "Waiting on content", [
                  { text: "Ok", onPress: () => {} },
                ]);
              },
            },
            {
              label: t("links:medLink"),
              onPress: () => {
                Alert.alert("Hello", "Waiting on content", [
                  { text: "Ok", onPress: () => {} },
                ]);
              },
            },
          ]}
        />
      </Screen>
    );
  }
}
const ExtraInfo = withNamespaces("extraInfoScreen")<Props>(ExtraInfoScreen);

export {
  Welcome,
  Why,
  What,
  Age,
  Symptoms,
  AddressScreen,
  SymptomsIneligible,
  ConsentIneligible,
  Confirmation,
  PushNotifications,
  Instructions,
  ExtraInfo,
};
