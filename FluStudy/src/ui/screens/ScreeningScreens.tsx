// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { format } from "date-fns";
import React from "react";
import { Alert, AppState, KeyboardAvoidingView, View } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import CheckBox from "react-native-check-box";
import axios from "axios";
import { createAccessKey } from "../../util/accessKey";
import { WorkflowInfo, ConsentInfoSignerType } from "audere-lib/feverProtocol";
import {
  Action,
  Address,
  Option,
  StoreState,
  setEmail,
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
import { ERROR_COLOR, KEYBOARD_BEHAVIOR, LARGE_TEXT } from "../styles";
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
import Text from "../components/Text";
import QuestionText from "../components/QuestionText";
import { GUTTER, SMALL_TEXT } from "../styles";
import { isPOBox, isValidAddress, isValidEmail } from "../../util/check";
import { getRemoteConfig } from "../../util/remoteConfig";
import { DEVICE_INFO, ios } from "../../transport/DeviceInfo";
import { tracker, FunnelEvents, AppHealthEvents } from "../../util/tracker";
import RadioGrid from "../components/RadioGrid";
import { getApiBaseUrl } from "../../transport";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

interface WorkflowProps {
  workflow: WorkflowInfo;
}

class WhyScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    if (!!getRemoteConfig("blockKitOrders")) {
      this.props.navigation.push("OutOfKits");
    } else {
      this.props.navigation.push("What");
    }
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("desc")}
        splashImage="whatdoidonext"
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      />
    );
  }
}
export const Why = withNamespaces("whyScreen")(WhyScreen);

class OutOfKitsScreen extends React.Component<Props & WithNamespaces> {
  componentDidMount() {
    tracker.logEvent(AppHealthEvents.KIT_ORDER_BLOCKED);
  }

  _onNext = () => {
    this.props.navigation.push("Age");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={false}
        desc={t("blockKitsDesc")}
        image="thanksforyourinterest"
        navigation={this.props.navigation}
        title={t("whatBlockKits")}
        skipButton={true}
        onNext={this._onNext}
      >
        <View>
          <Links links={["learnMore", "findMedHelp"]} />
          <Text
            content={t("disclaimer")}
            style={{
              alignSelf: "stretch",
              fontSize: SMALL_TEXT,
              marginBottom: GUTTER,
            }}
          />
        </View>
      </Screen>
    );
  }
}
export const OutOfKits = withNamespaces("outOfKitsScreen")(OutOfKitsScreen);

class WhatScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("Age");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        splashImage="whatdoidonext"
        navigation={this.props.navigation}
        title={t("what")}
        skipButton={false}
        onNext={this._onNext}
      />
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
      this.props.navigation.push("AgeIneligible");
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

class PreConsentScreen extends React.PureComponent<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("common:button:continue")}
        canProceed={true}
        centerDesc={true}
        hideBackButton={true}
        image="preconsent"
        navigation={this.props.navigation}
        onNext={() => this.props.navigation.push("Consent")}
        title={t("title")}
      >
        <Text
          style={{ marginTop: GUTTER, marginBottom: GUTTER }}
          content={t("description")}
        />
        {t("bullets")
          .split("\n")
          .map((bullet: string, index: number) => {
            return <BulletPoint key={`bullet-${index}`} content={bullet} />;
          })}
        <Text style={{ marginVertical: GUTTER }} content={t("questions")} />
        <Text
          italic={true}
          style={{ marginBottom: GUTTER * 2 }}
          content={t("instructions")}
        />
      </Screen>
    );
  }
}
export const PreConsent = withNamespaces("preConsentScreen")(PreConsentScreen);

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
          t("consentFormText", {
            amount: t("common:giftCardAmount"),
          }),
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={KEYBOARD_BEHAVIOR}
        enabled
      >
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
          hideBackButton={false}
          navigation={this.props.navigation}
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
            content={t("consentFormText", {
              amount: t("common:giftCardAmount"),
            })}
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

  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("back")}
        canProceed={true}
        image="thanksforyourinterest"
        navigation={this.props.navigation}
        title={t("ineligible")}
        desc={t("description")}
        onNext={() => this.props.navigation.pop()}
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

  navigation.push(didSkipScreening ? "WhatsNext" : "KitOrdered");
}

interface AddressState {
  address: Address;
  noResults: boolean;
  showValidationError: boolean;
  suggestedAddress: Address | null;
  triedToProceed: boolean;
}

interface DemoModeProps {
  isDemo: boolean;
}

interface IsConnectedProps {
  isConnected: boolean;
}

interface AddressValidatorProps {
  csruid: string;
}

@connect((state: StoreState) => ({
  email: state.survey.email,
  csruid: state.survey.csruid,
  isConnected: state.meta.isConnected,
  isDemo: state.meta.isDemo,
  workflow: state.survey.workflow,
}))
class AddressInputScreen extends React.Component<
  Props &
    DemoModeProps &
    IsConnectedProps &
    EmailProps &
    WorkflowProps &
    WithNamespaces &
    ReduxWriterProps &
    AddressValidatorProps,
  AddressState & EmailState
> {
  constructor(
    props: Props &
      IsConnectedProps &
      DemoModeProps &
      EmailProps &
      WorkflowProps &
      WithNamespaces &
      ReduxWriterProps &
      AddressValidatorProps
  ) {
    super(props);
    this.state = {
      address: props.getAnswer("addressInput", AddressConfig.id),
      email: props.email,
      noResults: false,
      showValidationError: false,
      suggestedAddress: null,
      triedToProceed: false,
    };
    this._onAddressChange = this._onAddressChange.bind(this);
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
      !this._isSameTrimmedString(address1.city, address2.city) ||
      !this._isSameTrimmedString(address1.state, address2.state) ||
      !this._isSameTrimmedString(address1.zipcode, address2.zipcode)
    );
  };

  emailInput = React.createRef<EmailInput>();

  _mapAddName = (results: any) => {
    return results.map((address: Address) => {
      address.firstName = this.state.address.firstName;
      address.lastName = this.state.address.lastName;
      return address;
    });
  };

  _onNext = async () => {
    const { dispatch, navigation, t, updateAnswer, workflow } = this.props;
    this.setState({ triedToProceed: true });
    tracker.logEvent(FunnelEvents.ADDRESS_ATTEMPTED);

    if (
      isValidAddress(this.state.address) &&
      isValidEmail(this.state.email) &&
      (!workflow.skippedScreeningAt || this._haveOption())
    ) {
      const config = !!this.props.workflow.skippedScreeningAt
        ? AddressConfig
        : MailingAddressConfig;

      dispatch(setEmail(this.state.email!));
      updateAnswer({ addressInput: this.state.address }, config);

      if (
        this.state.address!.state === "HI" ||
        this.state.address!.state === "AK"
      ) {
        tracker.logEvent(FunnelEvents.ADDRESS_STATE_INVALID, {
          state: this.state.address!.state,
        });
        this.props.navigation.push("StateIneligible");
        return;
      }

      if (isPOBox(this.state.address.address)) {
        tracker.logEvent(FunnelEvents.ADDRESS_PO_BOX_EXCLUDED);
        this.setState({ showValidationError: false });
        this.props.navigation.push("POBoxIneligible");
        return;
      }

      tracker.logEvent(FunnelEvents.ADDRESS_COMPLETED);
      tracker.logEvent(FunnelEvents.EMAIL_COMPLETED);
      this.setState({ triedToProceed: false, showValidationError: false });
      if (this.props.isDemo) {
        tracker.logEvent(FunnelEvents.ADDRESS_VERIFICATION_SKIPPED_DEMO);
        writeAddressAndNavigate(
          this.state.address,
          !!this.props.workflow.skippedScreeningAt,
          updateAnswer,
          navigation
        );
      } else if (this.props.isConnected) {
        try {
          const key = createAccessKey();
          const response = await axios.get(
            getApiBaseUrl() + "/validateUniqueAddress",
            {
              params: {
                key,
                csruid: this.props.csruid,
                address: this.state.address,
              },
            }
          );

          const current = this.state.address;
          const { suggestions, duplicate } = response.data;
          if (duplicate) {
            // Duplicate address entered
          }
          if (suggestions.length === 0) {
            tracker.logEvent(
              FunnelEvents.ADDRESS_VERIFICATION_RESULTS_OBTAINED,
              { count: suggestions.length }
            );
            this.setState({
              noResults: true,
              suggestedAddress: current,
            });
          } else if (
            suggestions.every((x: any) => this._isDifferentAddress(x, current))
          ) {
            tracker.logEvent(
              FunnelEvents.ADDRESS_VERIFICATION_RESULTS_OBTAINED,
              { count: suggestions.length, hasDifferent: true }
            );
            this.props.navigation.push("AddressConfirm", {
              original: current,
              suggestions: this._mapAddName(suggestions),
            });
          } else {
            tracker.logEvent(
              FunnelEvents.ADDRESS_VERIFICATION_RESULTS_OBTAINED,
              { count: suggestions.length }
            );
            writeAddressAndNavigate(
              this.state.address,
              !!this.props.workflow.skippedScreeningAt,
              this.props.updateAnswer,
              this.props.navigation
            );
          }
        } catch (error) {
          tracker.logEvent(AppHealthEvents.SMARTY_STREETS_ERROR, {
            error: JSON.stringify(error),
          });
          writeAddressAndNavigate(
            this.state.address,
            !!this.props.workflow.skippedScreeningAt,
            this.props.updateAnswer,
            this.props.navigation
          );
        }
      } else {
        tracker.logEvent(FunnelEvents.ADDRESS_VERIFICATION_SKIPPED_NO_INTERNET);
        Alert.alert(t("noInternetTitle"), t("noInternetSubtitle"));
      }
    } else {
      this.setState({ showValidationError: true });
    }
  };

  _onAddressChange = (newAddress: Address) => {
    const { email, triedToProceed } = this.state;
    const currentShowValidationError =
      !isValidAddress(newAddress) || !isValidEmail(email) || !triedToProceed;

    this.setState({
      address: newAddress,
      showValidationError: currentShowValidationError,
    });
  };

  _haveOption = () => {
    const whereKit = this.props.getAnswer(
      "selectedButtonKey",
      WhereKitConfig.id
    );
    return !!whereKit;
  };

  _onEmailChange = (newEmail: string) => {
    const { address, triedToProceed } = this.state;
    const newShowValidationError =
      !isValidAddress(address) || !isValidEmail(newEmail) || !triedToProceed;

    this.setState({
      email: newEmail,
      showValidationError: newShowValidationError,
    });
  };

  render() {
    const { navigation, t, workflow } = this.props;
    const {
      address,
      noResults,
      showValidationError,
      suggestedAddress,
      triedToProceed,
    } = this.state;
    const config = !!workflow.skippedScreeningAt
      ? AddressConfig
      : MailingAddressConfig;

    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={KEYBOARD_BEHAVIOR}
        enabled
      >
        <Screen
          buttonLabel={
            !!workflow.skippedScreeningAt
              ? undefined
              : t("common:button:submit")
          }
          canProceed={true}
          desc={
            !!workflow.skippedScreeningAt
              ? t("surveyDescription:addressDesc")
              : t("surveyDescription:mailingAddressDesc")
          }
          navigation={navigation}
          title={t("title")}
          onNext={this._onNext}
        >
          {triedToProceed && showValidationError ? (
            <Text
              style={{ color: ERROR_COLOR }}
              content={t("validationError")}
            />
          ) : (
            <View style={{ height: LARGE_TEXT }} />
          )}
          <QuestionText text={t("surveyTitle:address")} />
          <AddressInput
            autoFocus={navigation.isFocused()}
            onSubmitEditing={() => this.emailInput.current!.focus()}
            shouldValidate={triedToProceed}
            value={address}
            onChange={this._onAddressChange}
          />
          <AddressNotFoundModal
            address={suggestedAddress}
            visible={noResults}
            onDismiss={() => this.setState({ noResults: false })}
            onSubmit={() => {
              this.setState({ noResults: false });
              this.props.navigation.push("AddressIneligible");
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
            shouldValidate={triedToProceed}
            validationError={t("common:validationErrors:email")}
            value={this.state.email}
            onChange={this._onEmailChange}
          />
          {!!workflow.skippedScreeningAt && (
            <RadioGrid
              question={WhereKitConfig}
              shouldValidate={triedToProceed}
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
    if (
      this.state.selectedAddress != this.props.navigation.getParam("original")
    ) {
      tracker.logEvent(FunnelEvents.ADDRESS_CORRECTION_CHOSEN);
    } else {
      tracker.logEvent(FunnelEvents.ADDRESS_SUGGESTION_IGNORED);
    }
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={KEYBOARD_BEHAVIOR}
        enabled
      >
        <Screen
          canProceed={true}
          centerDesc={true}
          desc={t("description")}
          navigation={this.props.navigation}
          title={t("title")}
          onNext={this._onNext}
        >
          <RadioButtonGroup
            original={this.props.navigation.getParam("original")}
            suggestions={this.props.navigation.getParam("suggestions")}
            onChange={(selectedAddress: Address) =>
              this.setState({ selectedAddress })
            }
          />
        </Screen>
      </KeyboardAvoidingView>
    );
  }
}
export const AddressConfirm = reduxWriter(
  withNamespaces("addressConfirmScreen")(AddressConfirmScreen)
);

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
        image="thanksforyourinterest"
        navigation={this.props.navigation}
        skipButton={true}
        title={t("ineligible")}
      >
        <Links links={["learnMore", "findMedHelp"]} />
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

@connect((state: StoreState) => ({
  workflow: state.survey.workflow,
}))
class KitOrderedScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("ThankYouScreening");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("common:button:continue")}
        canProceed={true}
        desc={t("description")}
        image="flukitordered"
        navigation={this.props.navigation}
        onNext={this._onNext}
        title={t("title")}
      >
        {t("bullets")
          .split("\n")
          .map((bullet: string, index: number) => {
            return <BulletPoint key={`bullet-${index}`} content={bullet} />;
          })}
        <Text
          style={{ lineHeight: 22 }}
          italic={true}
          content={t("disclaimer")}
        />
      </Screen>
    );
  }
}
export const KitOrdered = withNamespaces("kitOrderedScreen")(KitOrderedScreen);

@connect((state: StoreState) => ({
  workflow: state.survey.workflow,
}))
class ThankYouScreeningScreen extends React.Component<
  Props & WorkflowProps & WithNamespaces
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
        buttonLabel={t("common:button:continue")}
        canProceed={false}
        desc={t("description")}
        image="thanksforparticipating"
        navigation={this.props.navigation}
        skipButton={true}
        title={t("title")}
      >
        {t("bullets")
          .split("\n")
          .map((bullet: string, index: number) => {
            return <BulletPoint key={`bullet-${index}`} content={bullet} />;
          })}
      </Screen>
    );
  }
}
export const ThankYouScreening = withNamespaces("thankYouScreeningScreen")(
  ThankYouScreeningScreen
);
