// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { BarCodeScanner, Camera, Permissions } from "expo";
import Spinner from "react-native-loading-spinner-overlay";
import DeviceInfo from "react-native-device-info";
import { SampleInfo, WorkflowInfo } from "audere-lib/feverProtocol";
import {
  Action,
  Option,
  StoreState,
  appendInvalidBarcode,
  setKitBarcode,
  setTestStripImg,
  setOneMinuteStartTime,
  setTenMinuteStartTime,
  setSupportCode,
  setWorkflow,
  uploader,
} from "../../store";
import {
  InContactConfig,
  SurveyQuestionData,
  WhenSymptomsScreenConfig,
  WhatSymptomsConfig,
  HouseholdChildrenConfig,
  GeneralExposureScreenConfig,
  MedConditionsConfig,
  FluShotConfig,
  FluShotDateConfig,
  TobaccoConfig,
  HouseholdTobaccoConfig,
  InterferingConfig,
  AntibioticsConfig,
  AssignedSexConfig,
  RaceConfig,
  HispanicConfig,
  InsuranceConfig,
  BlueLineConfig,
  RedWhenBlueConfig,
  RedLineConfig,
  FirstTestFeedbackConfig,
  SecondTestFeedbackConfig,
  OptInForMessagesConfig,
  AddressConfig,
} from "../../resources/ScreenConfig";
import reduxWriter, { ReduxWriterProps } from "../../store/ReduxWriter";
import timerWithConfigProps, { TimerProps } from "../components/Timer";
import { newCSRUID } from "../../util/csruid";
import BorderView from "../components/BorderView";
import BulletPoint from "../components/BulletPoint";
import Button from "../components/Button";
import ButtonGrid from "../components/ButtonGrid";
import Chrome from "../components/Chrome";
import DigitInput from "../components/DigitInput";
import Divider from "../components/Divider";
import Links from "../components/Links";
import Modal from "../components/Modal";
import MonthPicker from "../components/MonthPicker";
import OptionList, { newSelectedOptionsList } from "../components/OptionList";
import OptionQuestion from "../components/OptionQuestion";
import QuestionText from "../components/QuestionText";
import Screen from "../components/Screen";
import Text from "../components/Text";
import TextInput from "../components/TextInput";
import {
  findMedHelp,
  learnMore,
  scheduleUSPSPickUp,
  showNearbyShippingLocations,
  emailSupport,
} from "../externalActions";
import {
  invalidBarcodeShapeAlert,
  validBarcodeShape,
  verifiedBarcode,
  verifiedSupportCode,
  unverifiedBarcodeAlert,
} from "../../util/barcodeVerification";
import {
  ASPECT_RATIO,
  BORDER_RADIUS,
  BUTTON_WIDTH,
  ERROR_COLOR,
  GUTTER,
  KEYBOARD_BEHAVIOR,
  LARGE_TEXT,
  EXTRA_SMALL_TEXT,
  SECONDARY_COLOR,
  SMALL_TEXT,
  SYSTEM_PADDING_BOTTOM,
} from "../styles";
import { DEVICE_INFO } from "../../transport/DeviceInfo";
import { tracker, FunnelEvents } from "../../util/tracker";
import RadioGrid from "../components/RadioGrid";

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const TEST_STRIP_MS = 10 * MINUTE_MS;

const BARCODE_PREFIX = "KIT "; // Space intentional. Hardcoded, because never translated.
const FLUSHOT_START_DATE = new Date(2018, 0);

const scrollOptions = {
  align: "auto",
  animated: true,
  immediate: false,
  insets: {
    top: 0,
    bottom: 0,
  },
};

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

interface WorkflowProps {
  workflow: WorkflowInfo;
}

interface ConnectedProps {
  isConnected: boolean;
}

@connect((state: StoreState) => ({
  workflow: state.survey.workflow,
}))
class WelcomeBackScreen extends React.Component<
  Props & WorkflowProps & WithNamespaces
> {
  componentDidMount() {
    tracker.logEvent(FunnelEvents.RECEIVED_KIT);
  }

  _onBack = () => {
    this.props.dispatch(
      setWorkflow({
        ...this.props.workflow,
        skippedScreeningAt: undefined,
      })
    );

    this.props.navigation.pop();
  };

  _onNext = () => {
    if (!!this.props.workflow.skippedScreeningAt) {
      this.props.navigation.push("Age");
    } else {
      this.props.navigation.push("WhatsNext");
    }
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        hideBackButton={!this.props.workflow.skippedScreeningAt}
        imageSrc={{
          uri: "howtestworks_1",
        }}
        navigation={this.props.navigation}
        title={t("welcomeBack")}
        onBack={this._onBack}
        onNext={this._onNext}
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
export const WelcomeBack = withNamespaces("welcomeBackScreen")(
  WelcomeBackScreen
);

@connect((state: StoreState) => ({
  email: state.survey.email,
}))
class WhatsNextScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("ScanInstructions");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "preparingfortest",
        }}
        navigation={this.props.navigation}
        title={t("whatsNext")}
        onNext={this._onNext}
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
export const WhatsNext = withNamespaces("whatsNextScreen")(WhatsNextScreen);

// NOTE this screen has been removed. Leaving in code for redux state versioning.
class BeforeScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("ScanInstructions");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("flatStep")}
        imageSrc={{
          uri: "beforeyoubegin",
        }}
        navigation={this.props.navigation}
        title={t("beforeYouBegin")}
        onNext={this._onNext}
      />
    );
  }
}
export const Before = withNamespaces("beforeScreen")(BeforeScreen);

class ScanInstructionsScreen extends React.Component<Props & WithNamespaces> {
  constructor(props: Props & WithNamespaces) {
    super(props);
    this._onNext = this._onNext.bind(this);
  }

  async _onNext() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    if (status === "granted") {
      this.props.navigation.push("Scan");
    } else {
      this.props.navigation.push("ManualEntry");
    }
  }

  _onManualEntry = () => {
    this.props.navigation.push("ManualEntry");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description", {
          device: t("common:device:" + DEVICE_INFO.idiomText),
        })}
        footer={
          <View style={{ alignSelf: "stretch", marginTop: GUTTER / 2 }}>
            <Button
              enabled={true}
              label={t("okScan")}
              primary={true}
              style={{ alignSelf: "center" }}
              onPress={this._onNext}
            />
            <Links
              center={true}
              links={[
                {
                  label: t("inputManually"),
                  onPress: this._onManualEntry,
                },
              ]}
            />
          </View>
        }
        imageSrc={{
          uri: "barcodeonbox",
        }}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("scanQrCode")}
      >
        <Text content={t("tips")} style={{ marginBottom: GUTTER / 2 }} />
      </Screen>
    );
  }
}
export const ScanInstructions = withNamespaces("scanInstructionsScreen")(
  ScanInstructionsScreen
);

interface InvalidBarcodeProps {
  invalidBarcodes: SampleInfo[];
}

@connect((state: StoreState) => ({
  invalidBarcodes: state.survey.invalidBarcodes,
  workflow: state.survey.workflow,
}))
class ScanScreen extends React.Component<
  Props & InvalidBarcodeProps & WorkflowProps & WithNamespaces
> {
  state = {
    activeScan: false,
  };

  _willFocus: any;
  _willBlur: any;
  _timer: NodeJS.Timeout | null | undefined;

  componentDidMount() {
    this._willFocus = this.props.navigation.addListener("willFocus", () =>
      this._setTimer()
    );
    this._willBlur = this.props.navigation.addListener("willBlur", () =>
      this._clearTimer()
    );
  }

  componentWillUnmount() {
    this._willFocus.remove();
    this._willBlur.remove();
  }

  _setTimer() {
    this.setState({ activeScan: false });
    // Timeout after 30 seconds
    this._clearTimer();
    this._timer = setTimeout(() => {
      if (this.props.navigation.isFocused()) {
        this.props.navigation.push("ManualEntry");
      }
    }, 30000);
  }

  _clearTimer() {
    if (this._timer != null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  _onBarCodeScanned = async ({ type, data }: { type: any; data: string }) => {
    const { t } = this.props;
    const barcode = data.toLowerCase();

    if (!this.state.activeScan) {
      this.setState({ activeScan: true });
      if (!validBarcodeShape(barcode)) {
        invalidBarcodeShapeAlert(barcode, this._setTimer);
      } else {
        const serverVerifiedBarcode = await verifiedBarcode(barcode);
        if (!serverVerifiedBarcode) {
          const priorUnverifiedAttempts = !!this.props.invalidBarcodes
            ? this.props.invalidBarcodes.length
            : 0;
          this.props.dispatch(
            appendInvalidBarcode({
              sample_type: type,
              code: barcode,
            })
          );
          if (priorUnverifiedAttempts > 2) {
            this.props.navigation.push("BarcodeContactSupport");
          } else {
            unverifiedBarcodeAlert(t("scan"), this._setTimer);
          }
        } else {
          this.props.dispatch(
            setKitBarcode({
              sample_type: type,
              code: barcode,
            })
          );
          this.props.dispatch(
            setWorkflow({
              ...this.props.workflow,
              surveyStartedAt: new Date().toISOString(),
            })
          );
          this.props.navigation.push("ScanConfirmation");
        }
      }
    }
  };

  _onManualEntry = () => {
    this.props.navigation.push("ManualEntry");
  };

  render() {
    const { t } = this.props;
    return (
      <Chrome navigation={this.props.navigation}>
        <View style={{ flex: 1 }}>
          <BarCodeScanner
            style={{ flex: 1, alignSelf: "stretch" }}
            onBarCodeScanned={this._onBarCodeScanned}
          />
          <View style={scanStyles.overlayContainer}>
            <View style={scanStyles.targetBox} />
            <TouchableOpacity
              style={scanStyles.overlay}
              onPress={this._onManualEntry}
            >
              <Text
                center={true}
                content={t("enterManually")}
                style={scanStyles.overlayText}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Chrome>
    );
  }
}
const scanStyles = StyleSheet.create({
  overlayText: {
    color: "white",
    textDecorationLine: "underline",
  },
  overlay: {
    alignItems: "center",
    height: 50,
    justifyContent: "center",
    marginTop: 50,
    width: 300,
  },
  overlayContainer: {
    alignItems: "center",
    backgroundColor: "transparent",
    height: Dimensions.get("window").height,
    left: -GUTTER,
    justifyContent: "center",
    position: "absolute",
    top: 0,
    width: Dimensions.get("window").width,
  },
  targetBox: {
    borderColor: "#F5A623",
    borderRadius: 2,
    borderWidth: 4,
    height: 250,
    width: 250,
  },
});
export const Scan = withNamespaces("scanScreen")(ScanScreen);

interface BarcodeProps {
  kitBarcode: SampleInfo;
}

@connect((state: StoreState) => ({
  kitBarcode: state.survey.kitBarcode,
}))
class ScanConfirmationScreen extends React.Component<
  Props & BarcodeProps & WithNamespaces
> {
  componentDidMount() {
    tracker.logEvent(FunnelEvents.SCAN_CONFIRMATION);
  }

  _onNext = () => {
    this.props.navigation.push("Unpacking");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("common:button:continue")}
        canProceed={true}
        imageSrc={{
          uri: "barcodesuccess",
        }}
        navigation={this.props.navigation}
        title={t("codeSent")}
        onNext={this._onNext}
      >
        <BorderView style={{ marginTop: GUTTER }}>
          <Text
            center={true}
            content={
              t("yourCode") +
              (!!this.props.kitBarcode ? this.props.kitBarcode.code : "")
            }
          />
        </BorderView>
        <Text content={t("description")} style={{ marginVertical: GUTTER }} />
      </Screen>
    );
  }
}
export const ScanConfirmation = withNamespaces("scanConfirmationScreen")(
  ScanConfirmationScreen
);

@connect((state: StoreState) => ({
  kitBarcode: state.survey.kitBarcode,
}))
class ManualConfirmationScreen extends React.Component<
  Props & BarcodeProps & WithNamespaces
> {
  componentDidMount() {
    tracker.logEvent(FunnelEvents.MANUAL_CODE_CONFIRMATION);
  }

  _onNext = () => {
    this.props.navigation.push("Unpacking");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("common:button:continue")}
        canProceed={true}
        imageSrc={{
          uri: "barcodesuccess",
        }}
        navigation={this.props.navigation}
        title={t("codeSent")}
        onNext={this._onNext}
      >
        <BorderView style={{ marginTop: GUTTER }}>
          <Text
            center={true}
            content={
              "**" +
              t("yourCode") +
              "**" +
              BARCODE_PREFIX +
              this.props.kitBarcode.code
            }
          />
        </BorderView>
        <Text content={t("description")} style={{ marginVertical: GUTTER }} />
      </Screen>
    );
  }
}
export const ManualConfirmation = withNamespaces("manualConfirmationScreen")(
  ScanConfirmationScreen
);

interface SupportCodeProps {
  supportCode?: string;
}

interface ManualState {
  barcode1: string | null;
  barcode2: string | null;
}

@connect((state: StoreState) => ({
  invalidBarcodes: state.survey.invalidBarcodes,
  kitBarcode: state.survey.kitBarcode,
  supportCode: state.survey.supportCode,
  workflow: state.survey.workflow,
}))
class ManualEntryScreen extends React.Component<
  Props &
    InvalidBarcodeProps &
    SupportCodeProps &
    BarcodeProps &
    WorkflowProps &
    WithNamespaces,
  ManualState
> {
  constructor(
    props: Props &
      InvalidBarcodeProps &
      SupportCodeProps &
      BarcodeProps &
      WorkflowProps &
      WithNamespaces
  ) {
    super(props);
    this.state = {
      barcode1: !!props.kitBarcode ? props.kitBarcode.code.toLowerCase() : null,
      barcode2: !!props.kitBarcode ? props.kitBarcode.code.toLowerCase() : null,
    };
  }

  confirmInput = React.createRef<TextInput>();

  _matchingBarcodes = () => {
    return (
      this.state.barcode1 != null &&
      this.state.barcode2 != null &&
      this.state.barcode1.trim() === this.state.barcode2.trim()
    );
  };

  _onSave = () => {
    this.props.dispatch(
      setKitBarcode({
        sample_type: "manualEntry",
        code: this.state.barcode1!.trim(),
      })
    );
    this.props.dispatch(
      setWorkflow({
        ...this.props.workflow,
        surveyStartedAt: new Date().toISOString(),
      })
    );
    this.props.navigation.push("ManualConfirmation");
  };

  _onNext = async () => {
    const { t } = this.props;
    if (this.state.barcode1 == null) {
      Alert.alert("", t("barcodeRequired"), [
        { text: t("common:button:ok"), onPress: () => {} },
      ]);
    } else if (!this._matchingBarcodes()) {
      Alert.alert("", t("dontMatch"), [
        { text: t("common:button:ok"), onPress: () => {} },
      ]);
    } else if (!validBarcodeShape(this.state.barcode1)) {
      invalidBarcodeShapeAlert(this.state.barcode1);
    } else {
      const serverVerifiedBarcode = await verifiedBarcode(this.state.barcode1);
      if (!serverVerifiedBarcode) {
        const priorUnverifiedAttempts = !!this.props.invalidBarcodes
          ? this.props.invalidBarcodes.length
          : 0;
        this.props.dispatch(
          appendInvalidBarcode({
            sample_type: "manualEntry",
            code: this.state.barcode1,
          })
        );
        if (priorUnverifiedAttempts > 2 && !this.props.supportCode) {
          this.props.navigation.push("BarcodeContactSupport");
        } else {
          unverifiedBarcodeAlert(t("enter"));
        }
      } else {
        this._onSave();
      }
    }
  };

  _onBarcodeOneChange = (barcode1: string) => {
    this.setState({ barcode1: barcode1.toLowerCase() });
  };

  _onBarcodeTwoChange = (barcode2: string) => {
    this.setState({ barcode2: barcode2.toLowerCase() });
  };

  _onBarcodeOneSubmit = () => {
    this.confirmInput.current!.focus();
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
          buttonLabel={t("common:button:continue")}
          canProceed={true}
          desc={t("desc")}
          navigation={this.props.navigation}
          title={t("enterKit")}
          onNext={this._onNext}
        >
          <View
            style={{
              alignSelf: "stretch",
              flexDirection: "row",
              marginBottom: GUTTER,
            }}
          >
            <Text content={"KIT "} style={{ paddingVertical: 3 }} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={this.props.navigation.isFocused()}
              placeholder={t("placeholder")}
              returnKeyType="done"
              style={{ flex: 1 }}
              value={this.state.barcode1}
              onChangeText={this._onBarcodeOneChange}
              onSubmitEditing={this._onBarcodeOneSubmit}
            />
          </View>
          <View
            style={{
              alignSelf: "stretch",
              flexDirection: "row",
              marginBottom: GUTTER,
            }}
          >
            <Text content={"KIT "} style={{ paddingVertical: 3 }} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t("secondPlaceholder")}
              ref={this.confirmInput}
              returnKeyType="done"
              style={{ flex: 1 }}
              value={this.state.barcode2}
              onChangeText={this._onBarcodeTwoChange}
            />
          </View>
          <View
            style={{
              alignItems: "center",
              alignSelf: "stretch",
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: GUTTER,
            }}
          >
            <Image
              style={{ aspectRatio: 2.2, flex: 0.4 }}
              source={{ uri: "barcode" }}
            />
            <View style={{ flex: 0.6, paddingLeft: GUTTER }}>
              <Text
                bold={true}
                content={t("tipHeader")}
                style={{ marginBottom: GUTTER }}
              />
              <Text content={t("tips")} />
            </View>
          </View>
        </Screen>
      </KeyboardAvoidingView>
    );
  }
}
export const ManualEntry = withNamespaces("manualEntryScreen")(
  ManualEntryScreen
);

@connect()
class BarcodeContactSupportScreen extends React.Component<
  Props & WithNamespaces
> {
  state = {
    invalidCode: false,
    modalVisible: false,
    supportCode: "",
  };

  _updateSupportCode = (supportCode: string) => {
    this.setState({ supportCode });
    this._onSupportCodeSubmit(supportCode);
  };

  _onModalSubmit = () => {
    this._onSupportCodeSubmit(this.state.supportCode);
  };

  _toggleModal = () => {
    this.setState({ modalVisible: !this.state.modalVisible });
  };

  _onSupportCodeSubmit = (supportCode: string) => {
    if (verifiedSupportCode(supportCode)) {
      this.setState({ invalidCode: false });
      this.props.dispatch(setSupportCode(supportCode));
      this._toggleModal();
      this.props.navigation.push("ManualEntry");
    } else {
      this.setState({ invalidCode: true });
    }
  };

  render() {
    const { t } = this.props;
    const width = Dimensions.get("window").width;
    return (
      <Screen
        canProceed={false}
        desc={t("description")}
        footer={
          <Links
            center={true}
            links={[
              {
                label: t("links:supportCode"),
                onPress: this._toggleModal,
              },
            ]}
          />
        }
        hideBackButton={true}
        imageSrc={{
          uri: "contactsupport",
        }}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("title")}
      >
        <Modal
          height={280}
          width={width * 0.8}
          title={t("supportVerification")}
          visible={this.state.modalVisible}
          onDismiss={this._toggleModal}
          onSubmit={this._onModalSubmit}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={KEYBOARD_BEHAVIOR}
            enabled
          >
            <View style={{ justifyContent: "space-between", padding: GUTTER }}>
              <Text
                content={t("enterCode")}
                style={{ paddingBottom: GUTTER }}
              />
              <DigitInput
                digits={5}
                style={
                  this.state.invalidCode ? { color: ERROR_COLOR } : undefined
                }
                onSubmitEditing={this._updateSupportCode}
              />
              <Text
                center={true}
                content={this.state.invalidCode ? t("invalidCode") : ""}
                style={{ color: ERROR_COLOR, paddingVertical: GUTTER }}
              />
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </Screen>
    );
  }
}
export const BarcodeContactSupport = withNamespaces(
  "barcodeContactSupportScreen"
)(BarcodeContactSupportScreen);

// NOTE this screen has been removed. Leaving in code for redux state versioning.
class TestInstructionsScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("Unpacking");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("common:button:continue")}
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "whatsnext",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      />
    );
  }
}
export const TestInstructions = withNamespaces("testInstructionsScreen")(
  TestInstructionsScreen
);

class UnpackingScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("Swab");
  };

  _emailSupport = () => {
    emailSupport("?subject=Kit missing items");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "unpackinginstructions",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      >
        <Links
          links={[{ label: t("kitMissingItems"), onPress: this._emailSupport }]}
        />
      </Screen>
    );
  }
}
export const Unpacking = withNamespaces("unpackingScreen")(UnpackingScreen);

class SwabScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("SwabPrep");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "begin1sttest",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="beginFirstTest"
        onNext={this._onNext}
      />
    );
  }
}
export const Swab = withNamespaces("swabScreen")(SwabScreen);

class SwabPrepScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("OpenSwab");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "preparetube",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="prepareTube"
        onNext={this._onNext}
      />
    );
  }
}
export const SwabPrep = withNamespaces("swabPrepScreen")(SwabPrepScreen);

class OpenSwabScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("Mucus");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "opennasalswab",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      />
    );
  }
}
export const OpenSwab = withNamespaces("openSwabScreen")(OpenSwabScreen);

class MucusScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("SwabInTube");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "collectmucus",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="collectSample"
        onNext={this._onNext}
      />
    );
  }
}
export const Mucus = withNamespaces("mucusScreen")(MucusScreen);

@connect()
class SwabInTubeScreen extends React.Component<Props & WithNamespaces> {
  componentDidMount() {
    tracker.logEvent(FunnelEvents.SURVIVED_FIRST_SWAB);
  }

  _onNext = () => {
    this.props.dispatch(setOneMinuteStartTime());
    this.props.navigation.push("FirstTimer");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("startTimer")}
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "putswabintube",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="putSwabInTube"
        onNext={this._onNext}
      />
    );
  }
}
export const SwabInTube = withNamespaces("swabInTubeScreen")(SwabInTubeScreen);

interface FirstTimerProps {
  oneMinuteStartTime: number | undefined;
}

interface DemoModeProps {
  isDemo: boolean;
}

@connect((state: StoreState) => ({
  isDemo: state.meta.isDemo,
}))
class FirstTimerScreen extends React.Component<
  Props & DemoModeProps & FirstTimerProps & WithNamespaces & TimerProps
> {
  _onTitlePress = () => {
    this.props.isDemo && this.props.onFastForward();
  };

  _onNext = () => {
    this.props.onNext();
    this.props.navigation.push("RemoveSwabFromTube");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={this.props.done()}
        desc={this.props.getRemainingTime() > 30 * 1000 ? t("tip") : t("tip2")}
        footer={
          <View
            style={{
              alignSelf: "stretch",
              alignItems: "center",
              marginBottom: GUTTER,
            }}
          >
            {!this.props.done() && (
              <View style={{ alignSelf: "stretch" }}>
                <Text
                  content={t("note")}
                  style={{ alignSelf: "stretch", marginBottom: GUTTER }}
                />
                <BorderView
                  style={{
                    alignSelf: "center",
                    borderRadius: BORDER_RADIUS,
                    width: BUTTON_WIDTH,
                  }}
                >
                  <Text
                    bold={true}
                    content={this.props.getRemainingLabel()}
                    style={{ color: SECONDARY_COLOR }}
                  />
                </BorderView>
              </View>
            )}
          </View>
        }
        imageSrc={{
          uri: "oneminutetimer",
        }}
        navigation={this.props.navigation}
        skipButton={!this.props.done()}
        title={t("title")}
        onNext={this._onNext}
        onTitlePress={this._onTitlePress}
      />
    );
  }
}
export const FirstTimer = timerWithConfigProps({
  totalTimeMs: MINUTE_MS,
  startTimeConfig: "oneMinuteStartTime",
  nextScreen: "RemoveSwabFromTube",
})(withNamespaces("firstTimerScreen")(FirstTimerScreen));

class RemoveSwabFromTubeScreen extends React.Component<Props & WithNamespaces> {
  componentDidMount() {
    tracker.logEvent(FunnelEvents.PASSED_FIRST_TIMER);
  }

  _onNext = () => {
    this.props.navigation.push("OpenTestStrip");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("common:button:continue")}
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "removeswabfromtube",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="removeSwabFromTube"
        onNext={this._onNext}
      />
    );
  }
}
export const RemoveSwabFromTube = withNamespaces("removeSwabFromTubeScreen")(
  RemoveSwabFromTubeScreen
);

class OpenTestStripScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("StripInTube");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("common:button:continue")}
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "openteststrip",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="openTestStrip"
        onNext={this._onNext}
      />
    );
  }
}
export const OpenTestStrip = withNamespaces("openTestStripScreen")(
  OpenTestStripScreen
);

@connect()
class StripInTubeScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.dispatch(setTenMinuteStartTime());
    this.props.navigation.push("WhatSymptoms");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("common:button:continue")}
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "openteststrip_1",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="putTestStripInTube"
        onNext={this._onNext}
      />
    );
  }
}
export const StripInTube = withNamespaces("stripInTubeScreen")(
  StripInTubeScreen
);

class WhatSymptomsScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  _haveOption = () => {
    const symptoms: Option[] = this.props.getAnswer(
      "options",
      WhatSymptomsConfig.id
    );
    return symptoms
      ? symptoms.reduce(
          (result: boolean, option: Option) => result || option.selected,
          false
        )
      : false;
  };

  _onNext = () => {
    this.props.navigation.push("WhenSymptoms");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={this._haveOption()}
        centerDesc={true}
        desc={t("description")}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      >
        <Divider style={{ marginBottom: 0 }} />
        <OptionQuestion
          question={WhatSymptomsConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
      </Screen>
    );
  }
}
export const WhatSymptoms = reduxWriter(
  withNamespaces("surveyScreen")(WhatSymptomsScreen)
);

interface WhenSymptomsState {
  questionTypes: any[];
  highlighted: Set<string>;
}

class WhenSymptomsScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps,
  WhenSymptomsState
> {
  constructor(props: Props & WithNamespaces & ReduxWriterProps) {
    super(props);
    this.state = {
      questionTypes: WhenSymptomsScreenConfig.map((question: any) => {
        return this.props
          .getAnswer("options", WhatSymptomsConfig.id)
          .filter((option: Option) => option.selected)
          .map((option: Option) => {
            return {
              buttons: question.buttons,
              description: option.key,
              id: question.id + "_" + option.key,
              required: question.required,
              title: question.title,
              ref: question.required ? React.createRef() : null,
            };
          });
      }),
      highlighted: new Set(),
    };
  }

  _onNext = () => {
    if (this._isFormValidToSubmit()) {
      this.props.navigation.push("GeneralExposure");
    }
  };

  _isFormValidToSubmit = () => {
    const { questionTypes } = this.state;

    let requiredQuestions = new Set();
    let firstRequired: any = null;

    questionTypes.forEach(questions => {
      questions.forEach((question: any) => {
        if (
          question.required &&
          this.props.getAnswer("selectedButtonKey", question.id) === null
        ) {
          if (firstRequired === null) {
            firstRequired = question.ref;
          }
          requiredQuestions.add(question.id);
        }
      });
    });

    if (requiredQuestions.size > 0) {
      this.setState({ highlighted: requiredQuestions });
      firstRequired.scrollIntoView(scrollOptions);
      return false;
    }

    this.setState({ highlighted: new Set() });
    return true;
  };

  _renderQuestions = () => {
    const { t } = this.props;
    const { highlighted } = this.state;
    let toRender = [] as any[];
    this.state.questionTypes.forEach((answers, index) => {
      const question = WhenSymptomsScreenConfig[index];

      toRender.push(
        <QuestionText
          key={`${question.title}-${index}`}
          required={question.required}
          subtext={
            question.description &&
            t("surveyDescription:" + question.description)
          }
          text={t("surveyTitle:" + question.title)}
        />
      );

      toRender.push(
        answers.map((config: SurveyQuestionData, index: number) => {
          let buttonStyle = [];
          if (highlighted.has(config.id)) {
            buttonStyle.push({ borderColor: "red", borderWidth: 1 });
          }
          return (
            <ButtonGrid
              onRef={(ref: any) => {
                config.ref = ref;
              }}
              style={buttonStyle}
              key={config.id}
              question={config}
              title={t("surveyDescription:" + config.description) + ":"}
              getAnswer={this.props.getAnswer}
              updateAnswer={this.props.updateAnswer}
            />
          );
        })
      );
    });
    return toRender;
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        centerDesc={true}
        desc={t("description")}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      >
        <Divider />
        {this._renderQuestions()}
      </Screen>
    );
  }
}
export const WhenSymptoms = reduxWriter(
  withNamespaces("surveyScreen")(WhenSymptomsScreen)
);

class GeneralExposureScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  _questions = GeneralExposureScreenConfig;

  _onNext = () => {
    this.props.navigation.push("GeneralHealth");
  };

  render() {
    const width = Dimensions.get("window").width - 2 * GUTTER;
    const { t, getAnswer } = this.props;

    function conditionalQuestionFilter(question: SurveyQuestionData): boolean {
      switch (question.id) {
        case "CoughSneeze":
          return getAnswer("selectedButtonKey", InContactConfig.id) === "yes";
        case "ChildrenWithChildren":
          return (
            getAnswer("selectedButtonKey", HouseholdChildrenConfig.id) === "yes"
          );
        default:
          return true;
      }
    }

    return (
      <Screen
        canProceed={true}
        centerDesc={true}
        desc={t("description")}
        navigation={this.props.navigation}
        title={t("generalExposure")}
        onNext={this._onNext}
      >
        <Divider />
        <Text content={t("expoDesc")} style={{ marginBottom: GUTTER }} />
        <Image style={imageStyles.image} source={{ uri: "generalexposure" }} />
        <Text
          content={t("expoRef")}
          italic={true}
          style={{ marginBottom: GUTTER }}
        />
        {this._questions
          .filter(conditionalQuestionFilter)
          .map(
            question =>
              question.id === "YoungChildren" ? (
                <RadioGrid
                  key={question.id}
                  question={question}
                  getAnswer={this.props.getAnswer}
                  updateAnswer={this.props.updateAnswer}
                />
              ) : (
                <ButtonGrid
                  key={question.id}
                  question={question}
                  getAnswer={this.props.getAnswer}
                  updateAnswer={this.props.updateAnswer}
                />
              )
          )}
      </Screen>
    );
  }
}
export const GeneralExposure = reduxWriter(
  withNamespaces("surveyScreen")(GeneralExposureScreen)
);

interface GeneralHealhState {
  highlighted: string | null;
}

class GeneralHealthScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps,
  GeneralHealhState
> {
  scrollIntoViewRef = React.createRef();

  constructor(props: Props & WithNamespaces & ReduxWriterProps) {
    super(props);
    this.state = {
      highlighted: null,
    };
  }
  _onNext = () => {
    if (
      this.props.getAnswer("selectedButtonKey", AntibioticsConfig.id) === null
    ) {
      this.setState({ highlighted: AntibioticsConfig.id });
      (this.scrollIntoViewRef as any).scrollIntoView(scrollOptions);
    } else {
      this.setState({ highlighted: null });
      this.props.navigation.push("ThankYouSurvey");
    }
  };

  _onUpdateFluShotDate = (dateInput: Date | null) => {
    this.props.updateAnswer({ dateInput }, FluShotDateConfig);
  };

  render() {
    const { t } = this.props;
    const gotFluShot =
      this.props.getAnswer("selectedButtonKey", FluShotConfig.id) === "yes";

    return (
      <Screen
        canProceed={true}
        centerDesc={true}
        desc={t("description")}
        navigation={this.props.navigation}
        title={t("generalHealth")}
        onNext={this._onNext}
      >
        <Divider />
        <Text content={t("generalDesc")} />
        <OptionQuestion
          question={MedConditionsConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
        <ButtonGrid
          question={FluShotConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
        {gotFluShot && (
          <QuestionText text={t("surveyTitle:" + FluShotDateConfig.title)} />
        )}
        {gotFluShot && (
          <MonthPicker
            date={this.props.getAnswer("dateInput", FluShotDateConfig.id)}
            startDate={FLUSHOT_START_DATE}
            endDate={new Date(Date.now())}
            onDateChange={this._onUpdateFluShotDate}
          />
        )}
        <ButtonGrid
          question={TobaccoConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
        <ButtonGrid
          question={HouseholdTobaccoConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
        <ButtonGrid
          question={InterferingConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
        <ButtonGrid
          style={
            !!this.state.highlighted && { borderColor: "red", borderWidth: 1 }
          }
          onRef={(ref: any) => (this.scrollIntoViewRef = ref)}
          question={AntibioticsConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
        <ButtonGrid
          question={AssignedSexConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
        <OptionQuestion
          question={RaceConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
        <ButtonGrid
          question={HispanicConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
        <OptionQuestion
          question={InsuranceConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
      </Screen>
    );
  }
}
export const GeneralHealth = reduxWriter(
  withNamespaces("surveyScreen")(GeneralHealthScreen)
);

interface ThankYouSurveyProps {
  tenMinuteStartTime: number | undefined;
}

@connect((state: StoreState) => ({
  isDemo: state.meta.isDemo,
  tenMinuteStartTime: state.survey.tenMinuteStartTime,
}))
class ThankYouSurveyScreen extends React.Component<
  Props & DemoModeProps & WithNamespaces & ThankYouSurveyProps & TimerProps
> {
  componentDidMount() {
    tracker.logEvent(FunnelEvents.COMPLETED_SURVEY);
  }

  _onNext = () => {
    this.props.onNext();
    this.props.navigation.push("TestStripReady");
  };

  _onTitlePress = () => {
    this.props.isDemo && this.props.onFastForward();
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={this.props.done()}
        desc={t("desc")}
        footer={
          <View
            style={{
              alignSelf: "stretch",
              alignItems: "center",
              marginBottom: GUTTER,
            }}
          >
            {this.props.done() ? (
              <Button
                enabled={true}
                primary={true}
                label={t("common:button:continue")}
                onPress={this._onNext}
              />
            ) : (
              <BorderView
                style={{
                  alignSelf: "center",
                  borderRadius: BORDER_RADIUS,
                  width: BUTTON_WIDTH,
                }}
              >
                <Text
                  bold={true}
                  content={this.props.getRemainingLabel()}
                  style={{ color: SECONDARY_COLOR }}
                />
              </BorderView>
            )}
          </View>
        }
        imageSrc={{
          uri: "questionsthankyou",
        }}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("title")}
        onTitlePress={this._onTitlePress}
      >
        {!this.props.done() && (
          <Text content={t("waiting")} style={{ alignSelf: "stretch" }} />
        )}
      </Screen>
    );
  }
}
export const ThankYouSurvey = timerWithConfigProps({
  totalTimeMs: TEST_STRIP_MS,
  startTimeConfig: "tenMinuteStartTime",
  nextScreen: "TestStripReady",
})(withNamespaces("thankYouSurveyScreen")(ThankYouSurveyScreen));

class TestStripReadyScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("FinishTube");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("desc")}
        imageSrc={{
          uri: "removeteststrip",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="removeTestStrip"
        onNext={this._onNext}
      />
    );
  }
}
export const TestStripReady = withNamespaces("testStripReadyScreen")(
  TestStripReadyScreen
);

class FinishTubeScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("LookAtStrip");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "finishwithtube",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="finishWithTube"
        onNext={this._onNext}
      />
    );
  }
}
export const FinishTube = withNamespaces("finishTubeScreen")(FinishTubeScreen);

class LookAtStripScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("TestStripSurvey");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "lookatteststrip",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="lookAtTestStrip"
        onNext={this._onNext}
      />
    );
  }
}
export const LookAtStrip = withNamespaces("lookAtStripScreen")(
  LookAtStripScreen
);

class TestStripSurveyScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  constructor(props: Props & WithNamespaces & ReduxWriterProps) {
    super(props);
    this._onNext = this._onNext.bind(this);
  }

  async _onNext() {
    const { status } = await Permissions.getAsync(Permissions.CAMERA);
    const getAnswer = this.props.getAnswer;
    const blueAnswer = getAnswer("selectedButtonKey", BlueLineConfig.id);

    switch (blueAnswer) {
      case "yes":
        const redAnswer = getAnswer("selectedButtonKey", RedWhenBlueConfig.id);

        tracker.logEvent(FunnelEvents.RESULT_BLUE);
        switch (redAnswer) {
          case "yesAboveBlue":
          case "yesBelowBlue":
          case "yesAboveBelowBlue":
            tracker.logEvent(FunnelEvents.RESULT_BLUE_ANY_RED);
            break;
          case "noRed":
            tracker.logEvent(FunnelEvents.RESULT_BLUE_NO_RED);
            break;
        }
        break;

      case "no":
        tracker.logEvent(FunnelEvents.RESULT_NO_BLUE);
        break;
    }

    if (status === "denied") {
      this.props.navigation.push("CleanFirstTest");
    } else {
      this.props.navigation.push("PictureInstructions");
    }
  }

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("desc")}
        imageSrc={{
          uri: "lookatteststrip",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      >
        <ButtonGrid
          desc={true}
          question={BlueLineConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
        {this.props.getAnswer("selectedButtonKey", BlueLineConfig.id) ===
          "yes" && (
          <RadioGrid
            question={RedWhenBlueConfig}
            getAnswer={this.props.getAnswer}
            updateAnswer={this.props.updateAnswer}
          />
        )}
        {this.props.getAnswer("selectedButtonKey", BlueLineConfig.id) ===
          "no" && (
          <RadioGrid
            question={RedLineConfig}
            getAnswer={this.props.getAnswer}
            updateAnswer={this.props.updateAnswer}
          />
        )}
      </Screen>
    );
  }
}
export const TestStripSurvey = reduxWriter(
  withNamespaces("testStripSurveyScreen")(TestStripSurveyScreen)
);

class PictureInstructionsScreen extends React.Component<
  Props & WithNamespaces
> {
  constructor(props: Props & WithNamespaces) {
    super(props);
    this._onNext = this._onNext.bind(this);
    this._skip = this._skip.bind(this);
  }

  _skip() {
    this.props.navigation.push("CleanFirstTest");
  }

  async _onNext() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    if (status === "granted") {
      this.props.navigation.push("TestStripCamera");
    } else {
      this._skip();
    }
  }

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("desc")}
        footer={
          <Links
            center={true}
            links={[{ label: t("skip"), onPress: this._skip }]}
          />
        }
        imageSrc={{
          uri: "takepictureteststrip",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="takePhotoOfStrip"
        onNext={this._onNext}
      >
        <Image style={imageStyles.image} source={{ uri: "teststripcamera1" }} />
        <Text
          content={t("tip2")}
          style={{ alignSelf: "stretch", marginBottom: GUTTER }}
        />
        <Image style={imageStyles.image} source={{ uri: "teststripcamera2" }} />
        <Text
          content={t("tip3")}
          style={{ alignSelf: "stretch", marginBottom: GUTTER }}
        />
      </Screen>
    );
  }
}
export const PictureInstructions = withNamespaces("pictureInstructionsScreen")(
  PictureInstructionsScreen
);

@connect((state: StoreState) => ({
  isDemo: state.meta.isDemo,
}))
class TestStripCameraScreen extends React.Component<
  DemoModeProps & Props & WithNamespaces
> {
  camera = React.createRef<any>();

  constructor(props: DemoModeProps & Props & WithNamespaces) {
    super(props);
    this._takePicture = this._takePicture.bind(this);
  }

  state = {
    spinner: !DeviceInfo.isEmulator(),
  };

  _cameraReady = () => {
    this.setState({ spinner: false });
  };

  async _takePicture() {
    if (!this.state.spinner) {
      this.setState({ spinner: true });

      try {
        const photo = await this.camera.current!.takePictureAsync({
          quality: 0.8,
          base64: true,
          orientation: "portrait",
          fixOrientation: true,
        });
        const csruid = await newCSRUID();
        uploader.savePhoto(csruid, photo.base64);
        this.props.dispatch(
          setTestStripImg({
            sample_type: "TestStripBase64",
            code: csruid,
          })
        );
        this.setState({ spinner: false });
        this.props.navigation.push("TestStripConfirmation", {
          photo: photo.uri,
        });
      } catch (e) {
        this.setState({ spinner: false });
      }
    }
  }

  render() {
    const { t } = this.props;
    return (
      <Chrome isDemo={this.props.isDemo} navigation={this.props.navigation}>
        <View style={{ flex: 1, marginBottom: -1 * SYSTEM_PADDING_BOTTOM }}>
          <Spinner visible={this.state.spinner} />
          <Camera
            ref={this.camera}
            style={cameraStyles.camera}
            onCameraReady={this._cameraReady}
          />
          <View style={cameraStyles.overlayContainer}>
            <Text
              center={true}
              content={t("title")}
              style={cameraStyles.overlayText}
            />
            <View style={cameraStyles.innerContainer}>
              <Image
                style={cameraStyles.testStrip}
                source={{ uri: "teststripdetail" }}
              />
              <View style={{ flex: 1, marginLeft: GUTTER }}>
                <Text
                  center={true}
                  content={t("stripHere")}
                  style={cameraStyles.overlayText}
                />
                <View style={cameraStyles.targetBox} />
              </View>
            </View>
            <View style={{ alignItems: "center", alignSelf: "stretch" }}>
              <Text
                center={true}
                content={t("description")}
                style={cameraStyles.overlayText}
              />
              <TouchableOpacity onPress={this._takePicture}>
                <View style={cameraStyles.outerCircle}>
                  <View style={cameraStyles.circle} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Chrome>
    );
  }
}

const imageStyles = StyleSheet.create({
  image: {
    aspectRatio: ASPECT_RATIO,
    height: undefined,
    marginBottom: GUTTER,
    width: "100%",
  },
});

const cameraStyles = StyleSheet.create({
  camera: {
    alignSelf: "stretch",
    flex: 1,
  },
  innerContainer: {
    height: "100%",
    flexDirection: "row",
    flex: 1,
    marginHorizontal: GUTTER * 2,
    marginBottom: GUTTER,
  },
  outerCircle: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderColor: "white",
    borderWidth: 7,
    borderRadius: 40,
    height: 80,
    width: 80,
  },
  circle: {
    backgroundColor: "white",
    borderColor: "transparent",
    borderRadius: 30,
    borderWidth: 3,
    height: 60,
    width: 60,
  },
  overlayText: {
    color: "white",
    fontSize: LARGE_TEXT,
    marginVertical: GUTTER,
    textShadowColor: "rgba(0, 0, 0, 0.99)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  overlayContainer: {
    alignItems: "center",
    justifyContent: "space-between",
    left: 0,
    right: 0,
    position: "absolute",
    top: 0,
    bottom: 0,
    marginBottom: GUTTER + SYSTEM_PADDING_BOTTOM,
  },
  targetBox: {
    alignSelf: "center",
    borderColor: "white",
    borderRadius: 5,
    borderStyle: "dashed",
    borderWidth: 4,
    flex: 1,
    shadowColor: "rgba(0, 0, 0, 0.99)",
    shadowOffset: { width: -1, height: 1 },
    shadowRadius: 10,
    width: "65%",
  },
  testStrip: {
    alignSelf: "center",
    aspectRatio: 0.135,
    height: "95%",
    marginTop: GUTTER,
    marginLeft: GUTTER,
    width: undefined,
  },
});

export const TestStripCamera = withNamespaces("testStripCameraScreen")(
  TestStripCameraScreen
);

interface TestStripProps {
  testStripImg: SampleInfo;
}

class TestStripConfirmationScreen extends React.Component<
  Props & TestStripProps & WithNamespaces
> {
  _onNext = () => {
    this.props.navigation.push("CleanFirstTest");
  };

  render() {
    const { navigation, t } = this.props;
    const photo = navigation.getParam("photo", null);
    const screenWidth = Dimensions.get("window").width;
    const screenHeight = Dimensions.get("window").height;
    return (
      <Screen
        canProceed={true}
        desc={t("desc")}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      >
        {photo != null && (
          <Image
            style={{
              alignSelf: "center",
              aspectRatio: screenWidth / screenHeight,
              width: "50%",
              marginVertical: GUTTER,
            }}
            source={{ uri: photo }}
          />
        )}
      </Screen>
    );
  }
}
export const TestStripConfirmation = withNamespaces(
  "testStripConfirmationScreen"
)(TestStripConfirmationScreen);

class CleanFirstTestScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("CleanFirstTest2");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("desc")}
        imageSrc={{
          uri: "sealupteststrip",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="cleanUpFirstTest1"
        onNext={this._onNext}
      />
    );
  }
}
export const CleanFirstTest = withNamespaces("cleanFirstTestScreen")(
  CleanFirstTestScreen
);

class CleanFirstTest2Screen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("FirstTestFeedback");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("desc")}
        imageSrc={{
          uri: "putteststripbag2",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="cleanUpFirstTest2"
        onNext={this._onNext}
      />
    );
  }
}
export const CleanFirstTest2 = withNamespaces("cleanFirstTest2Screen")(
  CleanFirstTest2Screen
);

class FirstTestFeedbackScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  _onNext = () => {
    this.props.navigation.push("BeginSecondTest");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        imageSrc={{
          uri: "nicejob",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      >
        <RadioGrid
          desc={true}
          hideQuestion={false}
          question={FirstTestFeedbackConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
      </Screen>
    );
  }
}
export const FirstTestFeedback = reduxWriter(
  withNamespaces("firstTestFeedbackScreen")(FirstTestFeedbackScreen)
);

class BeginSecondTestScreen extends React.Component<Props & WithNamespaces> {
  componentDidMount() {
    tracker.logEvent(FunnelEvents.COMPLETED_FIRST_TEST);
  }

  _onNext = () => {
    this.props.navigation.push("PrepSecondTest");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "begin2ndtest",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="beginSecondTest"
        onNext={this._onNext}
      />
    );
  }
}
export const BeginSecondTest = withNamespaces("beginSecondTestScreen")(
  BeginSecondTestScreen
);

class PrepSecondTestScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("MucusSecond");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "preparefortest",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="prepareForTest"
        onNext={this._onNext}
      />
    );
  }
}
export const PrepSecondTest = withNamespaces("prepSecondTestScreen")(
  PrepSecondTestScreen
);

class MucusSecondScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("SwabInTubeSecond");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "collectmucus",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="collectSampleFromNose"
        onNext={this._onNext}
      />
    );
  }
}
export const MucusSecond = withNamespaces("mucusSecondScreen")(
  MucusSecondScreen
);

class SwabInTubeSecondScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("CleanSecondTest");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "putswabinredtube",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="putSwabInTube2"
        onNext={this._onNext}
      />
    );
  }
}
export const SwabInTubeSecond = withNamespaces("swabInTubeSecondScreen")(
  SwabInTubeSecondScreen
);

class CleanSecondTestScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("SecondTestFeedback");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "cleanupsecondtest",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="cleanUpSecondTest"
        onNext={this._onNext}
      />
    );
  }
}
export const CleanSecondTest = withNamespaces("cleanSecondTestScreen")(
  CleanSecondTestScreen
);

class SecondTestFeedbackScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  _onNext = () => {
    this.props.navigation.push("Packing");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        imageSrc={{
          uri: "nicejob",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      >
        <RadioGrid
          desc={true}
          hideQuestion={false}
          question={SecondTestFeedbackConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
      </Screen>
    );
  }
}
export const SecondTestFeedback = reduxWriter(
  withNamespaces("secondTestFeedbackScreen")(SecondTestFeedbackScreen)
);

class PackingScreen extends React.Component<Props & WithNamespaces> {
  componentDidMount() {
    tracker.logEvent(FunnelEvents.COMPLETED_SECOND_TEST);
  }

  _onNext = () => {
    this.props.navigation.push("Stickers");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "packingthingsup",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      />
    );
  }
}
export const Packing = withNamespaces("packingScreen")(PackingScreen);

class StickersScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("SecondBag");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "putstickersonbox",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="putStickersOnBox"
        onNext={this._onNext}
      />
    );
  }
}
export const Stickers = withNamespaces("stickersScreen")(StickersScreen);

class SecondBagScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("TapeBox");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "putbag2inbox",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="putBag2InBox"
        onNext={this._onNext}
      />
    );
  }
}
export const SecondBag = withNamespaces("secondBagScreen")(SecondBagScreen);

class TapeBoxScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("ShipBox");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "tapeupbox",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        videoId="tapeUpBox"
        onNext={this._onNext}
      />
    );
  }
}
export const TapeBox = withNamespaces("tapeBoxScreen")(TapeBoxScreen);

class ShipBoxScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  _onNext = () => {
    this.props.navigation.push("SchedulePickup");
  };

  _onDropOff = () => {
    this.props.navigation.push("EmailOptIn");
  };

  _onShowNearbyUsps = () => {
    const addressInput = this.props.getAnswer("addressInput", AddressConfig.id);
    showNearbyShippingLocations(addressInput.zipcode);
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("schedulePickup")}
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "shippingyourbox",
        }}
        footer={
          <Button
            enabled={true}
            label={t("iWillDropOff")}
            primary={true}
            textStyle={{ fontSize: EXTRA_SMALL_TEXT }}
            onPress={this._onDropOff}
          />
        }
        navigation={this.props.navigation}
        title={t("title")}
        videoId="shipBox"
        onNext={this._onNext}
      >
        <Links
          links={[
            {
              label: t("showNearbyUsps"),
              onPress: this._onShowNearbyUsps,
            },
          ]}
        />
      </Screen>
    );
  }
}
export const ShipBox = reduxWriter(
  withNamespaces("shipBoxScreen")(ShipBoxScreen)
);

class SchedulePickupScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    scheduleUSPSPickUp(() => {
      this.props.navigation.push("EmailOptIn");
    });
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("title")}
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "schedulepickup",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      >
        <BulletPoint content={t("rule1")} />
        <BulletPoint content={t("rule2")} />
      </Screen>
    );
  }
}
export const SchedulePickup = withNamespaces("schedulePickupScreen")(
  SchedulePickupScreen
);

interface EmailProps {
  email?: string;
}

@connect((state: StoreState) => ({
  isConnected: state.meta.isConnected,
  workflow: state.survey.workflow,
}))
class EmailOptInScreen extends React.Component<
  Props & ConnectedProps & WorkflowProps & WithNamespaces & ReduxWriterProps
> {
  componentDidMount() {
    tracker.logEvent(FunnelEvents.COMPLETED_SHIPPING);
  }

  _onNext = async () => {
    const { isConnected, t } = this.props;

    this.props.dispatch(
      setWorkflow({
        ...this.props.workflow,
        surveyCompletedAt: new Date().toISOString(),
      })
    );

    const awaitingUpload = await uploader.documentsAwaitingUpload();

    if (!!awaitingUpload && awaitingUpload > 0 && !isConnected) {
      Alert.alert(
        t("common:notifications:dataUploadTitle"),
        t("common:notifications:dataUploadDesc"),
        [{ text: "Try Again" }]
      );
    } else {
      this.props.navigation.push("Thanks");
    }
  };

  _onChange = (options: Option[]) => {
    this.props.updateAnswer({ options }, OptInForMessagesConfig);
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("common:button:continue")}
        canProceed={true}
        desc={t("description")}
        imageSrc={{
          uri: "optinmessages",
        }}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      >
        <OptionList
          data={newSelectedOptionsList(
            OptInForMessagesConfig.optionList!.options,
            this.props.getAnswer("options", OptInForMessagesConfig.id)
          )}
          multiSelect={true}
          numColumns={1}
          style={{ marginBottom: GUTTER }}
          onChange={this._onChange}
        />
      </Screen>
    );
  }
}
export const EmailOptIn = reduxWriter(
  withNamespaces("emailOptInScreen")(EmailOptInScreen)
);

interface ThanksScreenProps {
  email: string;
}

@connect((state: StoreState) => ({
  email: state.survey.email,
}))
class ThanksScreen extends React.Component<
  Props & ThanksScreenProps & WithNamespaces & ReduxWriterProps
> {
  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={false}
        desc={t("description", { email: this.props.email })}
        imageSrc={{
          uri: "finalthanks",
        }}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("title")}
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
export const Thanks = reduxWriter(withNamespaces("thanksScreen")(ThanksScreen));
