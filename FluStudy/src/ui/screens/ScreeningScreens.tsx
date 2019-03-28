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
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import CheckBox from "react-native-check-box";
import axios from "axios";
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
  MailingAddressConfig,
  AddressConfig,
  WhereKitConfig,
  AgeBuckets,
  AgeConfig,
  ConsentConfig,
  SurveyQuestionData,
  SymptomsConfig,
} from "../../resources/ScreenConfig";
import { ERROR_COLOR } from "../styles";
import reduxWriter, { ReduxWriterProps } from "../../store/ReduxWriter";
import AddressInput from "../components/AddressInput";
import RadioButtonGroup from "../components/RadioButtonGroup";
import Button from "../components/Button";
import BulletPoint from "../components/BulletPoint";
import Divider from "../components/Divider";
import AddressNotFoundModal from "../components/AddressNotFoundModal";
import EmailInput from "../components/EmailInput";
import Screen from "../components/Screen";
import Links from "../components/Links";
import OptionList, { newSelectedOptionsList } from "../components/OptionList";
import OptionQuestion from "../components/OptionQuestion";
import Text from "../components/Text";
import QuestionText from "../components/QuestionText";
import { findMedHelp, learnMore } from "../externalActions";
import { GUTTER, SMALL_TEXT } from "../styles";
import { isValidAddress, isValidEmail } from "../../util/check";
import { getRemoteConfig } from "../../util/remoteConfig";
import { DEVICE_INFO, ios } from "../../transport/DeviceInfo";
import { tracker, FunnelEvents } from "../../util/tracker";
import RadioGrid from "../components/RadioGrid";
import { getApiBaseUrl } from "../../transport";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

interface WorkflowProps {
  workflow: WorkflowInfo;
}

@connect((state: StoreState) => ({
  workflow: state.survey.workflow,
}))
class WelcomeScreen extends React.Component<
  Props & WorkflowProps & WithNamespaces
> {
  _onNext = () => {
    this.props.navigation.push("Why");
  };

  _onSkipPartOne = () => {
    this.props.dispatch(
      setWorkflow({
        ...this.props.workflow,
        skippedScreeningAt: new Date().toISOString(),
      })
    );
    this.props.navigation.push("WelcomeBack");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        footer={
          <View style={{ alignSelf: "stretch", marginTop: GUTTER / 2 }}>
            <Button
              enabled={true}
              label={t("common:button:continue")}
              primary={true}
              style={{ alignSelf: "center" }}
              onPress={this._onNext}
            />
            <Links
              center={true}
              links={[{ label: t("haveKit"), onPress: this._onSkipPartOne }]}
            />
          </View>
        }
        hideBackButton={true}
        navigation={this.props.navigation}
        skipButton={true}
        stableImageSrc={{ uri: "img/welcome" }}
        title={t("welcome")}
      />
    );
  }
}
export const Welcome = withNamespaces("welcomeScreen")(WelcomeScreen);

class WhyScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("What");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        stableImageSrc={{ uri: "img/whyThisStudy" }}
        navigation={this.props.navigation}
        title={t("why")}
        onNext={this._onNext}
      />
    );
  }
}
export const Why = withNamespaces("whyScreen")(WhyScreen);

class WhatScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("Age");
  };

  render() {
    const { t } = this.props;
    const blockKits = getRemoteConfig("blockKitOrders");
    return (
      <Screen
        canProceed={!blockKits}
        desc={blockKits ? t("blockKitsDesc") : t("description")}
        stableImageSrc={{ uri: "img/whatDoIDoNext" }}
        navigation={this.props.navigation}
        title={blockKits ? t("whatBlockKits") : t("what")}
        skipButton={blockKits}
        onNext={this._onNext}
      >
        {blockKits && (
          <View>
            <Links
              links={[
                {
                  label: t("links:learnLink"),
                  onPress: learnMore,
                },
                {
                  label: t("links:medLink"),
                  onPress: findMedHelp,
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
          </View>
        )}
      </Screen>
    );
  }
}
export const What = withNamespaces("whatScreen")(WhatScreen);

@connect((state: StoreState) => ({
  workflow: state.survey.workflow,
}))
class AgeScreen extends React.Component<
  Props & WorkflowProps & WithNamespaces & ReduxWriterProps
> {
  _onNext = () => {
    const ageBucket = this.props.getAnswer("selectedButtonKey", AgeConfig.id);
    if (ageBucket === AgeBuckets.Under18) {
      this.props.navigation.push("Ineligible", {
        description: "descriptionAge",
        funnelEvent: FunnelEvents.AGE_INELIGIBLE,
        hideBack: true,
      });
    } else {
      if (!!this.props.workflow.skippedScreeningAt) {
        this.props.navigation.push("PreConsent");
      } else {
        this.props.navigation.push("Symptoms");
      }
    }
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={!!this.props.getAnswer("selectedButtonKey", AgeConfig.id)}
        navigation={this.props.navigation}
        skipButton={false}
        step={!!this.props.workflow.skippedScreeningAt ? undefined : 1}
        title={t("surveyTitle:" + AgeConfig.title)}
        onNext={this._onNext}
      >
        <RadioGrid
          desc={false}
          hideQuestion={true}
          question={AgeConfig}
          style={{ marginTop: GUTTER }}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
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
      this.props.navigation.push("PreConsent");
    } else {
      this.props.navigation.push("SymptomsIneligible");
    }
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

  _hasSymptoms = () => {
    const symptoms: Option[] = this.props.getAnswer(
      "options",
      SymptomsConfig.id
    );
    return symptoms && symptoms.some(symptom => symptom.selected);
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

  _onChange = (symptoms: Option[]) => {
    this.props.updateAnswer({ options: symptoms }, SymptomsConfig);
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={this._hasSymptoms()}
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
          onChange={this._onChange}
        />
      </Screen>
    );
  }
}
export const Symptoms = reduxWriter(
  withNamespaces("symptomsScreen")(SymptomsScreen)
);

@connect((state: StoreState) => ({
  workflow: state.survey.workflow,
}))
class PreConsentScreen extends React.PureComponent<
  Props & WorkflowProps & WithNamespaces & ReduxWriterProps
> {
  _renderBullets = (arr: string[]) => {
    const { t } = this.props;
    return (
      <View>
        {arr.map((bullet, index) => {
          return <BulletPoint key={`bullet-${index}`} content={bullet} />;
        })}
      </View>
    );
  };

  render() {
    const { t } = this.props;
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" enabled>
        <Screen
          buttonLabel={t("common:button:continue")}
          canProceed={true}
          centerDesc={true}
          hideBackButton={false}
          imageSrc={{ uri: "img/preConsent" }}
          navigation={this.props.navigation}
          onNext={() => this.props.navigation.push("Consent")}
          step={!!this.props.workflow.skippedScreeningAt ? undefined : 3}
          title={t("title")}
        >
          <ScrollView>
            <Text
              style={{ marginTop: GUTTER, marginBottom: GUTTER }}
              content={t("description")}
            />
            {this._renderBullets(t("bullets").split("\n"))}
            <Text style={{ marginVertical: GUTTER }} content={t("questions")} />
            <Text
              italic={true}
              style={{ marginBottom: GUTTER * 2 }}
              content={t("instructions")}
            />
          </ScrollView>
        </Screen>
      </KeyboardAvoidingView>
    );
  }
}
export const PreConsent = reduxWriter(
  withNamespaces("preConsentScreen")(PreConsentScreen)
);

interface EmailProps {
  email?: string;
}

interface EmailState {
  email?: string;
  triedToProceed: boolean;
}

@connect((state: StoreState) => ({
  email: state.survey.email,
  workflow: state.survey.workflow,
}))
class ConsentScreen extends React.PureComponent<
  Props & EmailProps & WorkflowProps & WithNamespaces & ReduxWriterProps,
  EmailState
> {
  constructor(
    props: Props &
      EmailProps &
      WorkflowProps &
      WithNamespaces &
      ReduxWriterProps
  ) {
    super(props);
    this.state = {
      email: props.email,
      triedToProceed: false,
    };
  }

  componentDidMount() {
    tracker.logEvent(FunnelEvents.MET_SYMPTOMS);
  }

  _onNext = () => {
    const { t } = this.props;
    if (
      this.props.getAnswer("booleanInput", ConsentConfig.id) &&
      !isValidEmail(this.state.email)
    ) {
      if (!this.state.triedToProceed) {
        this.setState({ triedToProceed: true });
      }
      return;
    }

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
        appBuild: ios ? DEVICE_INFO.clientVersion["iosBuild"] : undefined,
      })
    );
    this.props.navigation.push("Address");
    tracker.logEvent(FunnelEvents.CONSENT_COMPLETED);
  };

  emailInput = React.createRef<EmailInput>();

  _onNoThanks = () => {
    this.props.navigation.push("ConsentIneligible");
  };

  _onEmailConsent = () => {
    this.props.updateAnswer(
      {
        booleanInput: !this.props.getAnswer("booleanInput", ConsentConfig.id),
      },
      ConsentConfig
    );
  };

  _onChangeEmail = (email: string) => {
    this.setState({ email });
  };

  render() {
    const { t } = this.props;
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" enabled>
        <Screen
          buttonLabel={t("accept")}
          canProceed={true}
          centerDesc={true}
          desc={t("description")}
          footer={
            <Button
              enabled={true}
              primary={false}
              label={t("noThanks")}
              onPress={this._onNoThanks}
            />
          }
          hideBackButton={true} // Must not allow age-changing
          navigation={this.props.navigation}
          step={!!this.props.workflow.skippedScreeningAt ? undefined : 3}
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
            onClick={this._onEmailConsent}
          />
          {!!this.props.getAnswer("booleanInput", ConsentConfig.id) && (
            <View style={{ flex: 1 }}>
              <EmailInput
                autoFocus={this.props.navigation.isFocused()}
                placeholder={t("common:placeholder:enterEmail")}
                ref={this.emailInput}
                returnKeyType="next"
                shouldValidate={this.state.triedToProceed}
                validationError={t("common:validationErrors:email")}
                value={this.state.email}
                onChange={this._onChangeEmail}
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
    tracker.logEvent(FunnelEvents.CONSENT_INELIGIBLE);
  }

  _onBack = () => {
    this.props.navigation.pop();
  };

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
            onPress={this._onBack}
          />
        }
        imageSrc={{ uri: "img/thanksForYourInterest" }}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("ineligible")}
        desc={t("description")}
      />
    );
  }
}
export const ConsentIneligible = withNamespaces("consentIneligibleScreen")(
  ConsentIneligibleScreen
);

function writeAddressAndNavigate(
  address: Address | null,
  didSkipScreening: boolean,
  updateAnswer: (answer: object, data: SurveyQuestionData) => void,
  navigation: NavigationScreenProp<any, any>
) {
  const config = didSkipScreening ? AddressConfig : MailingAddressConfig;
  updateAnswer({ addressInput: address }, config);

  navigation.push(didSkipScreening ? "WhatsNext" : "Confirmation");
}

interface AddressState {
  address: Address;
  noResults: boolean;
  suggestedAddress: Address | null;
  triedToProceed: boolean;
}

interface DemoModeProps {
  isDemo: boolean;
}

@connect((state: StoreState) => ({
  email: state.survey.email,
  workflow: state.survey.workflow,
  isDemo: state.meta.isDemo,
}))
class AddressInputScreen extends React.Component<
  Props &
    DemoModeProps &
    EmailProps &
    WorkflowProps &
    WithNamespaces &
    ReduxWriterProps,
  AddressState & EmailState
> {
  constructor(
    props: Props &
      DemoModeProps &
      EmailProps &
      WorkflowProps &
      WithNamespaces &
      ReduxWriterProps
  ) {
    super(props);
    this.state = {
      address: props.getAnswer("addressInput", AddressConfig.id),
      email: props.email,
      suggestedAddress: null,
      noResults: false,
      triedToProceed: false,
    };
  }

  _isSameTrimmedString = (
    str1: string | undefined,
    str2: string | undefined
  ) => {
    return str1 === str2 || (!!str1 && !!str2 && str1.trim() === str2.trim());
  };

  _isDifferentAddress = (address1: Address, address2: Address) => {
    return (
      !this._isSameTrimmedString(address1.address, address2.address) ||
      !this._isSameTrimmedString(address1.address2, address2.address2) ||
      !this._isSameTrimmedString(address1.city, address2.city) ||
      !this._isSameTrimmedString(address1.state, address2.state) ||
      !this._isSameTrimmedString(address1.zipcode, address2.zipcode)
    );
  };

  emailInput = React.createRef<EmailInput>();

  _onNext = async () => {
    const { t } = this.props;
    this.setState({ triedToProceed: true });
    tracker.logEvent(FunnelEvents.ADDRESS_ATTEMPTED);

    if (
      isValidAddress(this.state.address) &&
      isValidEmail(this.state.email) &&
      (!this.props.workflow.skippedScreeningAt || this._haveOption())
    ) {
      const { address, address2, city, state, zipcode } = this.state.address;
      const config = !!this.props.workflow.skippedScreeningAt
        ? AddressConfig
        : MailingAddressConfig;

      this.props.dispatch(setEmail(this.state.email!));
      this.props.updateAnswer({ addressInput: this.state.address }, config);

      if (
        this.state.address!.state === "HI" ||
        this.state.address!.state === "AK"
      ) {
        this.props.navigation.push("StateIneligible");
        return;
      }

      tracker.logEvent(FunnelEvents.ADDRESS_COMPLETED);
      tracker.logEvent(FunnelEvents.EMAIL_COMPLETED);

      if (this.props.isDemo) {
        this.setState({ triedToProceed: false });
        writeAddressAndNavigate(
          this.state.address,
          !!this.props.workflow.skippedScreeningAt,
          this.props.updateAnswer,
          this.props.navigation
        );
      } else {
        try {
          const response = await axios.get(
            getApiBaseUrl() + "/validateAddress",
            {
              params: {
                address,
                address2,
                city,
                state,
                zipcode,
              },
            }
          );

          const unfilteredResultCount = response.data.length;
          const resultsWithoutName: Address[] = response.data.filter(
            (address: Address) =>
              this._isDifferentAddress(address, this.state.address)
          );
          const results: Address[] = resultsWithoutName.map(
            (address: Address) => {
              address.firstName = this.state.address.firstName;
              address.lastName = this.state.address.lastName;
              return address;
            }
          );
          this.setState({ triedToProceed: false });
          if (unfilteredResultCount === 0) {
            this.setState({
              noResults: true,
              suggestedAddress: this.state.address,
            });
          } else if (unfilteredResultCount != results.length) {
            writeAddressAndNavigate(
              this.state.address,
              !!this.props.workflow.skippedScreeningAt,
              this.props.updateAnswer,
              this.props.navigation
            );
          } else if (results.length >= 1) {
            this.props.navigation.push("AddressConfirm", {
              original: this.state.address,
              suggestions: results,
            });
          }
        } catch (error) {
          Alert.alert(t("noInternetTitle"), t("noInternetSubtitle"));
        }
      }
    }
  };

  _onAddressChange = (address: Address) => {
    this.setState({ address });
  };

  _haveOption = () => {
    const whereKit = this.props.getAnswer(
      "selectedButtonKey",
      WhereKitConfig.id
    );
    return !!whereKit;
  };

  _onChangeEmail = (email: string) => {
    this.setState({ email });
  };

  render() {
    const { t } = this.props;
    const config = !!this.props.workflow.skippedScreeningAt
      ? AddressConfig
      : MailingAddressConfig;

    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" enabled>
        <Screen
          buttonLabel={
            !!this.props.workflow.skippedScreeningAt
              ? undefined
              : t("common:button:submit")
          }
          canProceed={true}
          desc={
            !!this.props.workflow.skippedScreeningAt
              ? t("surveyDescription:addressDesc")
              : t("surveyDescription:mailingAddressDesc")
          }
          navigation={this.props.navigation}
          step={!!this.props.workflow.skippedScreeningAt ? undefined : 4}
          title={t("title")}
          onNext={this._onNext}
        >
          {this.state.triedToProceed && (
            <Text
              style={{ color: ERROR_COLOR }}
              content={t("validationError")}
            />
          )}
          <QuestionText text={t("surveyTitle:address")} />
          <AddressInput
            autoFocus={this.props.navigation.isFocused()}
            onSubmitEditing={() => this.emailInput.current!.focus()}
            shouldValidate={this.state.triedToProceed}
            value={this.state.address}
            onChange={(address: Address) => this.setState({ address })}
          />
          <AddressNotFoundModal
            address={this.state.suggestedAddress}
            visible={this.state.noResults}
            onDismiss={() => this.setState({ noResults: false })}
            onSubmit={() => {
              this.setState({ noResults: false });
              this.props.navigation.push("Ineligible", {
                description: "descriptionAddress",
                funnelEvent: FunnelEvents.ADDRESS_INELIGIBLE,
                hideBack: false,
              });
            }}
          />
          {!this.props.workflow.skippedScreeningAt && (
            <Text
              content={t("addressExceptions")}
              style={{ fontSize: SMALL_TEXT, marginBottom: GUTTER }}
            />
          )}
          <QuestionText text={t("email")} />
          <EmailInput
            autoFocus={false}
            placeholder={t("common:placeholder:emailEx")}
            ref={this.emailInput}
            returnKeyType="next"
            shouldValidate={this.state.triedToProceed}
            validationError={t("common:validationErrors:email")}
            value={this.state.email}
            onChange={this._onChangeEmail}
          />
          {!!this.props.workflow.skippedScreeningAt && (
            <RadioGrid
              question={WhereKitConfig}
              shouldValidate={this.state.triedToProceed}
              validationError={t("common:validationErrors:whereKit")}
              getAnswer={this.props.getAnswer}
              updateAnswer={this.props.updateAnswer}
            />
          )}
        </Screen>
      </KeyboardAvoidingView>
    );
  }
}
export const AddressScreen = reduxWriter(
  withNamespaces("addressScreen")(AddressInputScreen)
);

interface AddressConfirmState {
  selectedAddress: Address | null;
  suggestedAddresses: Address[] | null;
}

@connect((state: StoreState) => ({
  workflow: state.survey.workflow,
}))
class AddressConfirmScreen extends React.Component<
  Props & WorkflowProps & WithNamespaces & ReduxWriterProps,
  AddressConfirmState
> {
  constructor(
    props: Props & WorkflowProps & WithNamespaces & ReduxWriterProps
  ) {
    super(props);
    this.state = {
      selectedAddress: this.props.navigation.getParam("original"),
      suggestedAddresses: this.props.navigation.getParam("suggestions"),
    };
  }

  _onNext = () => {
    writeAddressAndNavigate(
      this.state.selectedAddress,
      !!this.props.workflow.skippedScreeningAt,
      this.props.updateAnswer,
      this.props.navigation
    );
  };

  render() {
    const { t } = this.props;
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" enabled>
        <Screen
          buttonLabel={
            !!this.props.workflow.skippedScreeningAt
              ? undefined
              : t("common:button:continue")
          }
          canProceed={true}
          centerDesc={true}
          desc={t("description")}
          navigation={this.props.navigation}
          step={!!this.props.workflow.skippedScreeningAt ? undefined : 4}
          title={t("title")}
          onNext={this._onNext}
        >
          <View>
            <RadioButtonGroup
              original={this.props.navigation.getParam("original")}
              suggestions={this.props.navigation.getParam("suggestions")}
              onChange={(selectedAddress: Address) =>
                this.setState({ selectedAddress })
              }
            />
          </View>
        </Screen>
      </KeyboardAvoidingView>
    );
  }
}
export const AddressConfirm = reduxWriter(
  withNamespaces("addressConfirmScreen")(AddressConfirmScreen)
);

class AgeIneligibleScreen extends React.Component<Props & WithNamespaces> {
  componentDidMount() {
    tracker.logEvent(FunnelEvents.AGE_INELIGIBLE);
  }

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={false}
        desc={t("description")}
        hideBackButton={true}
        imageSrc={{ uri: "img/thanksForYourInterest" }}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("ineligible")}
      >
        <Links
          links={[
            {
              label: t("links:learnLink"),
              onPress: learnMore,
            },
            {
              label: t("links:medLink"),
              onPress: findMedHelp,
            },
          ]}
        />
      </Screen>
    );
  }
}
export const AgeIneligible = withNamespaces("ageIneligibleScreen")(
  AgeIneligibleScreen
);

class IneligibleScreen extends React.Component<Props & WithNamespaces> {
  componentDidMount() {
    tracker.logEvent(this.props.navigation.getParam("funnelEvent"));
  }

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={false}
        desc={t(this.props.navigation.getParam("description"))}
        hideBackButton={this.props.navigation.getParam("hideBack")}
        imageSrc={{ uri: "img/thanksForYourInterest" }}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("ineligible")}
      >
        <Links
          links={[
            {
              label: t("links:learnLink"),
              onPress: learnMore,
            },
            {
              label: t("links:medLink"),
              onPress: findMedHelp,
            },
          ]}
        />
      </Screen>
    );
  }
}
export const Ineligible = withNamespaces("ineligibleScreen")(IneligibleScreen);

class SymptomsIneligibleScreen extends React.Component<Props & WithNamespaces> {
  componentDidMount() {
    tracker.logEvent(FunnelEvents.SYMPTOMS_INELIGIBLE);
  }

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={false}
        desc={t("description")}
        hideBackButton={true}
        imageSrc={{ uri: "img/thanksForYourInterest" }}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("ineligible")}
      >
        <Links
          links={[
            {
              label: t("links:learnLink"),
              onPress: learnMore,
            },
            {
              label: t("links:medLink"),
              onPress: findMedHelp,
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
export const SymptomsIneligible = withNamespaces("symptomsIneligibleScreen")(
  SymptomsIneligibleScreen
);

class StateIneligibleScreen extends React.Component<Props & WithNamespaces> {
  componentDidMount() {
    tracker.logEvent(FunnelEvents.STATE_INELIGIBLE);
  }

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={false}
        desc={t("description")}
        hideBackButton={false}
        imageSrc={{ uri: "img/thanksForYourInterest" }}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("ineligible")}
      >
        <Links
          links={[
            {
              label: t("links:learnLink"),
              onPress: learnMore,
            },
            {
              label: t("links:medLink"),
              onPress: findMedHelp,
            },
          ]}
        />
      </Screen>
    );
  }
}
export const StateIneligible = withNamespaces("stateIneligibleScreen")(
  StateIneligibleScreen
);

interface PushProps {
  pushState: PushNotificationState;
}

@connect((state: StoreState) => ({
  pushState: state.survey.pushState,
  workflow: state.survey.workflow,
}))
class ConfirmationScreen extends React.Component<
  Props & WorkflowProps & PushProps & WithNamespaces
> {
  componentDidMount() {
    this.props.dispatch(
      setWorkflow({
        ...this.props.workflow,
        screeningCompletedAt: new Date().toISOString(),
      })
    );
  }

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description", {
          device: t("common:device:" + DEVICE_INFO.idiomText),
        })}
        imageSrc={{ uri: "img/fluKitOrdered" }}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("confirmed")}
      >
        <Links
          links={[
            {
              label: t("links:learnLink"),
              onPress: learnMore,
            },
            {
              label: t("links:medLink"),
              onPress: findMedHelp,
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
export const Confirmation = withNamespaces("confirmationScreen")(
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

  _onNo = () => {
    const newPushState = {
      ...this.props.pushState,
      softResponse: false,
    };
    this.props.dispatch(setPushNotificationState(newPushState));
    this.props.navigation.push("ExtraInfo");
  };

  _onYes = () => {
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
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("common:button:yes")}
        canProceed={true}
        desc={t("description")}
        footer={
          <Button
            enabled={true}
            primary={false}
            label={t("common:button:no")}
            onPress={this._onNo}
          />
        }
        imageSrc={{ uri: "img/pushNotifications" }}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("pushNotifications")}
        onNext={this._onYes}
      />
    );
  }
}
export const PushNotifications = withNamespaces("pushNotificationsScreen")(
  PushNotificationsScreen
);
