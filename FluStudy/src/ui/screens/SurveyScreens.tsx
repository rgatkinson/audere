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
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { BarCodeScanner, Camera, Permissions } from "expo";
import Spinner from "react-native-loading-spinner-overlay";
import {
  EventInfoKind,
  SampleInfo,
  WorkflowInfo,
} from "audere-lib/feverProtocol";
import {
  Action,
  Option,
  StoreState,
  setEmail,
  setKitBarcode,
  setTestStripImg,
  setTenMinuteStartTime,
  setWorkflow,
} from "../../store";
import {
  CoughSneezeConfig,
  InContactConfig,
  Last48Config,
  SymptomSeverityConfig,
  SurveyQuestionData,
  SymptomsStartConfig,
  WhatSymptomsConfig,
  YoungChildrenConfig,
  HouseholdChildrenConfig,
  ChildrenWithChildrenConfig,
  PeopleInHouseholdConfig,
  BedroomsConfig,
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
import { newCSRUID } from "../../util/csruid";
import { uploader } from "../../store"
import BorderView from "../components/BorderView";
import BulletPoint from "../components/BulletPoint";
import Button from "../components/Button";
import ButtonGrid from "../components/ButtonGrid";
import Divider from "../components/Divider";
import EmailInput from "../components/EmailInput";
import ImageGrid from "../components/ImageGrid";
import ImageText from "../components/ImageText";
import MonthPicker from "../components/MonthPicker";
import Links from "../components/Links";
import OptionList, { newSelectedOptionsList } from "../components/OptionList";
import OptionQuestion from "../components/OptionQuestion";
import QuestionText from "../components/QuestionText";
import Screen from "../components/Screen";
import Text from "../components/Text";
import TextInput from "../components/TextInput";
import Title from "../components/Title";
import {
  findMedHelp,
  learnMore,
  scheduleUSPSPickUp,
  showNearbyShippingLocations,
} from "../externalActions";
import { GUTTER, LARGE_TEXT, STATUS_BAR_HEIGHT } from "../styles";
import { timestampRender, timestampInteraction } from "./analytics";

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const TEST_STRIP_MS = 10 * MINUTE_MS;

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

@connect()
class WelcomeBackScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("WelcomeBackScreen", (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={require("../../img/welcome.png")}
        logo={true}
        navBar={false}
        navigation={this.props.navigation}
        title={t("welcomeBack")}
        onNext={() => {
          this.props.navigation.push("WhatsNext");
        }}
      />
    ));
  }
}
export const WelcomeBack = withNamespaces("welcomeBackScreen")<Props>(
  WelcomeBackScreen
);

@connect((state: StoreState) => ({
  email: state.survey.email,
}))
class WhatsNextScreen extends React.Component<
  Props & EmailProps & WithNamespaces,
  EmailState
> {
  constructor(props: Props & EmailProps & WithNamespaces) {
    super(props);
    this.state = {
      email: props.email,
      validEmail: !!props.email,
    };
  }

  render() {
    const { t } = this.props;
    return timestampRender("WhatsNextScreen", (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" enabled>
        <Screen
          canProceed={this.state.validEmail}
          desc={t("description")}
          imageSrc={require("../../img/why.png")}
          logo={true}
          navBar={false}
          navigation={this.props.navigation}
          title={t("whatsNext")}
          onNext={() => {
            this.props.dispatch(setEmail(this.state.email!));
            this.props.navigation.push("Before");
          }}>

          <EmailInput
            autoFocus={this.props.navigation.isFocused()}
            placeholder={t("common:placeholder:enterEmail")}
            returnKeyType="next"
            validationError={t("common:validationErrors:email")}
            value={this.state.email}
            onChange={(email, validEmail) => this.setState({ email, validEmail })}
            onSubmit={validEmail => this.setState({ validEmail })}
          />
        </Screen>
      </KeyboardAvoidingView>
    ));
  }
}
export const WhatsNext = withNamespaces("whatsNextScreen")<Props>(
  WhatsNextScreen
);

class BeforeScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("BeforeScreen", (
      <Screen
        canProceed={true}
        logo={true}
        navBar={false}
        navigation={this.props.navigation}
        title={t("beforeYouBegin")}
        onNext={() => {
          this.props.navigation.push("ScanInstructions");
        }}
      >
        <ImageText
          imageSrc={require("../../img/soap.png")}
          imageWidth={100}
          text={t("washStep")}
        />
        <ImageText
          imageSrc={require("../../img/water.png")}
          imageWidth={100}
          text={t("waterStep")}
        />
        <ImageText
          imageSrc={require("../../img/cat.png")}
          imageWidth={100}
          text={t("flatStep")}
        />
      </Screen>
    ));
  }
}
export const Before = withNamespaces("beforeScreen")<Props>(BeforeScreen);

class ScanInstructionsScreen extends React.Component<Props & WithNamespaces> {
  async _onNext() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    if (status === "granted") {
      this.props.navigation.push("Scan");
    } else {
      this.props.navigation.push("ManualEntry");
    }
  }

  render() {
    const { t } = this.props;
    return timestampRender("ScanInstructionsScreen", (
      <Screen
        canProceed={true}
        desc={t("description")}
        footer={
          <View style={{ alignSelf: "stretch" }}>
            <Button
              enabled={true}
              label={t("okScan")}
              primary={true}
              onPress={async () => {
                await this._onNext();
              }}
            />
            <Links
              center={true}
              links={[
                {
                  label: t("inputManually"),
                  onPress: () => {
                    this.props.navigation.push("ManualEntry");
                  },
                },
              ]}
            />
          </View>
        }
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("scanQrCode")}
        onNext={async () => {
          await this._onNext();
        }}
      >
        <BorderView>
          <Image
            style={{ height: 180, width: 250 }}
            source={require("../../img/barcodeBox.png")}
          />
        </BorderView>
        <Text content={t("tips")} style={{ marginBottom: GUTTER / 2 }} />
      </Screen>
    ));
  }
}
export const ScanInstructions = withNamespaces("scanInstructionsScreen")<Props>(
  ScanInstructionsScreen
);

interface WorkflowProps {
  workflow: WorkflowInfo;
}

@connect((state: StoreState) => ({
  workflow: state.survey.workflow,
}))
class ScanScreen extends React.Component<
  Props & WorkflowProps & WithNamespaces
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

  render() {
    const { t } = this.props;
    return timestampRender("ScanScreen", (
      <View style={{ flex: 1 }}>
        <BarCodeScanner
          style={{ flex: 1, alignSelf: "stretch" }}
          onBarCodeScanned={({ type, data }: { type: any; data: string }) => {
            if (!this.state.activeScan) {
              this.setState({ activeScan: true });
              this.props.dispatch(
                setKitBarcode({
                  sample_type: type,
                  code: data,
                })
              );
              this.props.dispatch(
                setWorkflow({
                  ...this.props.workflow,
                  surveyStarted: true,
                })
              );
              this.props.navigation.push("ScanConfirmation");
            }
          }}
        />
        <View style={scanStyles.overlayContainer}>
          <View style={scanStyles.targetBox} />
          <TouchableOpacity
            style={scanStyles.overlay}
            onPress={() => {
              this.props.navigation.push("ManualEntry");
            }}
          >
            <Text
              center={true}
              content={t("enterManually")}
              style={scanStyles.overlayText}
            />
          </TouchableOpacity>
        </View>
      </View>
    ));
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
    height: Dimensions.get("window").height,
    left: 0,
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
export const Scan = withNamespaces("scanScreen")<Props & WorkflowProps>(
  ScanScreen
);

interface BarcodeProps {
  kitBarcode: SampleInfo;
}

@connect((state: StoreState) => ({
  kitBarcode: state.survey.kitBarcode,
}))
class ScanConfirmationScreen extends React.Component<
  Props & BarcodeProps & WithNamespaces
> {
  render() {
    const { t } = this.props;
    return timestampRender("ScanConfirmationScreen", (
      <Screen
        buttonLabel={t("common:button:continue")}
        canProceed={true}
        imageSrc={require("../../img/phoneBarcode.png")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("codeSent")}
        onNext={() => {
          this.props.navigation.push("TestInstructions");
        }}
      >
        <BorderView>
          <Text
            center={true}
            content={t("yourCode") + this.props.kitBarcode.code}
          />
        </BorderView>
        <Text content={t("description")} style={{ marginVertical: GUTTER }} />
        <Text content={t("nextStep")} />
      </Screen>
    ));
  }
}
export const ScanConfirmation = withNamespaces("scanConfirmationScreen")<
  Props & BarcodeProps
>(ScanConfirmationScreen);

@connect((state: StoreState) => ({
  kitBarcode: state.survey.kitBarcode,
}))
class ManualConfirmationScreen extends React.Component<
  Props & BarcodeProps & WithNamespaces
> {
  render() {
    const { t } = this.props;
    return timestampRender("ManualConfirmationScreen", (
      <Screen
        buttonLabel={t("common:button:continue")}
        canProceed={true}
        imageSrc={require("../../img/phoneBarcode.png")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("codeSent")}
        onNext={() => {
          this.props.navigation.push("TestInstructions");
        }}
      >
        <BorderView>
          <Text
            center={true}
            content={"**" + t("yourCode") + "**" + this.props.kitBarcode.code}
          />
        </BorderView>
        <Text content={t("description")} style={{ marginVertical: GUTTER }} />
        <Text content={t("nextStep")} />
      </Screen>
    ));
  }
}
export const ManualConfirmation = withNamespaces("manualConfirmationScreen")<
  Props & BarcodeProps
>(ScanConfirmationScreen);

interface ManualState {
  barcode1: string | null;
  barcode2: string | null;
}

@connect((state: StoreState) => ({
  kitBarcode: state.survey.kitBarcode,
  workflow: state.survey.workflow,
}))
class ManualEntryScreen extends React.Component<
  Props & BarcodeProps & WorkflowProps & WithNamespaces,
  ManualState
> {
  constructor(props: Props & BarcodeProps & WorkflowProps & WithNamespaces) {
    super(props);
    this.state = {
      barcode1: !!props.kitBarcode ? props.kitBarcode.code : null,
      barcode2: !!props.kitBarcode ? props.kitBarcode.code : null,
    };
  }

  confirmInput = React.createRef<TextInput>();

  _validBarcodes = () => {
    return (
      !!this.state.barcode1 &&
      this.state.barcode1.length === 8 &&
      this.state.barcode1 === this.state.barcode2
    );
  };

  _onSave = () => {
    if (this._validBarcodes()) {
      this.props.dispatch(
        setKitBarcode({
          sample_type: "manualEntry",
          code: this.state.barcode1!,
        })
      );
      this.props.dispatch(
        setWorkflow({
          ...this.props.workflow,
          surveyStarted: true,
        })
      );
      this.props.navigation.push("ManualConfirmation");
    }
  };

  render() {
    const { t } = this.props;
    const width = (Dimensions.get("window").width - 3 * GUTTER) / 3;
    return timestampRender("ManualEntryScreen", (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" enabled>
        <Screen
          buttonLabel={t("common:button:continue")}
          canProceed={this._validBarcodes()}
          desc={t("desc")}
          logo={true}
          navBar={true}
          navigation={this.props.navigation}
          title={t("enterKit")}
          onNext={this._onSave}
        >
          <TextInput
            autoFocus={this.props.navigation.isFocused()}
            autoCorrect={false}
            placeholder={t("placeholder")}
            returnKeyType="done"
            style={{ marginBottom: GUTTER }}
            value={this.state.barcode1}
            onChangeText={(text: string) => {
              this.setState({ barcode1: text });
            }}
            onSubmitEditing={() => this.confirmInput.current!.focus()}
          />
          <TextInput
            autoCorrect={false}
            placeholder={t("secondPlaceholder")}
            ref={this.confirmInput}
            returnKeyType="done"
            style={{ marginBottom: GUTTER }}
            value={this.state.barcode2}
            onChangeText={(text: string) => {
              this.setState({ barcode2: text });
            }}
            onSubmitEditing={() => {}}
          />
          <ImageText
            imageSrc={require("../../img/barcodeSample.png")}
            imageWidth={width}
            text={t("tips")}
          />
        </Screen>
      </KeyboardAvoidingView>
    ));
  }
}
export const ManualEntry = withNamespaces("manualEntryScreen")<
  Props & BarcodeProps & WorkflowProps
>(ManualEntryScreen);

class TestInstructionsScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("Swab");
  };

  render() {
    const { t } = this.props;
    return timestampRender("TestInstructionsScreen", (
      <Screen
        buttonLabel={t("common:button:continue")}
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      />
    ));
  }
}
export const TestInstructions = withNamespaces("testInstructionsScreen")<Props>(
  TestInstructionsScreen
);

class SwabScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("SwabScreen", (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/swabBox.png")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("SwabPrep");
        }}
      />
    ));
  }
}
export const Swab = withNamespaces("swabScreen")<Props>(SwabScreen);

class SwabPrepScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("SwabPrepScreen", (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("Mucus");
        }}
      />
    ));
  }
}
export const SwabPrep = withNamespaces("swabPrepScreen")<Props>(SwabPrepScreen);

class MucusScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("MucusScreen", (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/mucus.png")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("SwabInTube");
        }}
      />
    ));
  }
}
export const Mucus = withNamespaces("mucusScreen")<Props>(MucusScreen);

class SwabInTubeScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("SwabInTubeScreen", (
      <Screen
        buttonLabel={t("startTimer")}
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("FirstTimer");
        }}
      />
    ));
  }
}
export const SwabInTube = withNamespaces("swabInTubeScreen")<Props>(
  SwabInTubeScreen
);

interface DemoModeProps {
  isDemo: boolean;
}

@connect((state: StoreState) => ({
  isDemo: state.meta.isDemo,
}))
class FirstTimerScreen extends React.Component<Props & DemoModeProps & WithNamespaces> {
  state = {
    time: 60,
  };

  _timer: number | null | undefined;
  _willFocus: any;

  componentDidMount() {
    this._willFocus = this.props.navigation.addListener("willFocus", () =>
      this._setTimer()
    );
  }

  componentWillUnmount() {
    this._willFocus.remove();
  }

  _setTimer() {
    if (this.props.navigation.isFocused()) {
      setTimeout(() => {
        if (this.props.navigation.isFocused() && this.state.time > 1) {
          this.setState({ time: this.state.time - 1 });
          this._setTimer();
        } else if (this.props.navigation.isFocused()) {
          this.props.navigation.push("FirstTimerDone");
        }
      }, 1000);
    }
  }

  _canProceed = () => {
    return false;
  };

  render() {
    const { t } = this.props;
    return timestampRender("FirstTimerScreen", (
      <Screen
        canProceed={this._canProceed()}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title", { time: this.state.time })}
        onTitlePress={
          this.props.isDemo ?
          () => { this.setState({ time: 5 }); } :
          undefined
        }
        onNext={() => {}}
      >
        <Text content={t("tip")} />
      </Screen>
    ));
  }
}
export const FirstTimer = withNamespaces("firstTimerScreen")<Props & DemoModeProps>(
  FirstTimerScreen
);

class FirstTimerDoneScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("FirstTimerDoneScreen", (
      <Screen
        canProceed={true}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("RemoveSwabFromTube");
        }}
      >
        <Text content={t("tip")} />
      </Screen>
    ));
  }
}
export const FirstTimerDone = withNamespaces("firstTimerDoneScreen")<Props>(
  FirstTimerDoneScreen
);

class RemoveSwabFromTubeScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("RemoveSwabFromTubeScreen", (
      <Screen
        buttonLabel={t("common:button:continue")}
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("OpenTestStrip");
        }}
      />
    ));
  }
}
export const RemoveSwabFromTube = withNamespaces("removeSwabFromTubeScreen")<
  Props
>(RemoveSwabFromTubeScreen);

class OpenTestStripScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("OpenTestStripScreen", (
      <Screen
        buttonLabel={t("common:button:continue")}
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("StripInTube");
        }}
      />
    ));
  }
}
export const OpenTestStrip = withNamespaces("openTestStripScreen")<Props>(
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
    return timestampRender("StripInTubeScreen", (
      <Screen
        buttonLabel={t("common:button:continue")}
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      />
    ));
  }
}
export const StripInTube = withNamespaces("stripInTubeScreen")<Props>(
  StripInTubeScreen
);

class WhatSymptomsScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  _onNext = () => {
    this.props.navigation.push("WhenSymptoms");
  };

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

  render() {
    const { t } = this.props;
    return timestampRender("WhatSymptomsScreen", (
      <Screen
        canProceed={this._haveOption()}
        centerDesc={true}
        desc={t("description")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      >
        <Divider />
        <OptionQuestion
          question={WhatSymptomsConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
      </Screen>
    ));
  }
}
export const WhatSymptoms = reduxWriter(
  withNamespaces("surveyScreen")(WhatSymptomsScreen)
);

interface WhenSymptomsState {
  symptomsStartConfigs: SurveyQuestionData[];
  last48Configs: SurveyQuestionData[];
  severityConfigs: SurveyQuestionData[];
}

class WhenSymptomsScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps,
  WhenSymptomsState
> {
  constructor(props: Props & WithNamespaces & ReduxWriterProps) {
    super(props);
    this.state = {
      symptomsStartConfigs: props
        .getAnswer("options", WhatSymptomsConfig.id)
        .filter((option: Option) => option.selected)
        .map((option: Option) => {
          return {
            buttons: SymptomsStartConfig.buttons,
            description: option.key,
            id: SymptomsStartConfig.id + "_" + option.key,
            required: SymptomsStartConfig.required,
            title: SymptomsStartConfig.title,
          };
        }),
      last48Configs: props
        .getAnswer("options", WhatSymptomsConfig.id)
        .filter((option: Option) => option.selected)
        .map((option: Option) => {
          return {
            buttons: Last48Config.buttons,
            description: option.key,
            id: Last48Config.id + "_" + option.key,
            required: Last48Config.required,
            title: Last48Config.title,
          };
        }),
      severityConfigs: props
        .getAnswer("options", WhatSymptomsConfig.id)
        .filter((option: Option) => option.selected)
        .map((option: Option) => {
          return {
            buttons: SymptomSeverityConfig.buttons,
            description: option.key,
            id: SymptomSeverityConfig.id + "_" + option.key,
            required: SymptomSeverityConfig.required,
            title: SymptomSeverityConfig.title,
          };
        }),
    };
  }

  _onNext = () => {
    this.props.navigation.push("GeneralExposure");
  };

  _canProceed = () => {
    return (
      this.state.symptomsStartConfigs.reduce(
        (result, question) =>
          result &&
          this.props.getAnswer("selectedButtonKey", question.id) != null,
        true
      ) &&
      this.state.last48Configs.reduce(
        (result, question) =>
          result &&
          this.props.getAnswer("selectedButtonKey", question.id) != null,
        true
      ) &&
      this.state.severityConfigs.reduce(
        (result, question) =>
          result &&
          this.props.getAnswer("selectedButtonKey", question.id) != null,
        true
      )
    );
  };

  render() {
    const { t } = this.props;
    return timestampRender("WhenSymptomsScreen", (
      <Screen
        canProceed={this._canProceed()}
        centerDesc={true}
        desc={t("description")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      >
        <Divider />
        <QuestionText
          required={SymptomsStartConfig.required}
          subtext={t("surveyDescription:" + SymptomsStartConfig.description)}
          text={t("surveyTitle:" + SymptomsStartConfig.title)}
        />
        {this.state.symptomsStartConfigs.map((config: SurveyQuestionData) => {
          return (
            <ButtonGrid
              key={config.id}
              question={config}
              title={t("surveyDescription:" + config.description) + ":"}
              getAnswer={this.props.getAnswer}
              updateAnswer={this.props.updateAnswer}
            />
          );
        })}
        <QuestionText
          required={Last48Config.required}
          subtext={t("surveyDescription:" + Last48Config.description)}
          text={t("surveyTitle:" + Last48Config.title)}
        />
        {this.state.last48Configs.map((config: SurveyQuestionData) => {
          return (
            <ButtonGrid
              buttonStyle={{ width: "50%" }}
              key={config.id}
              question={config}
              title={t("surveyDescription:" + config.description) + ":"}
              getAnswer={this.props.getAnswer}
              updateAnswer={this.props.updateAnswer}
            />
          );
        })}
        <QuestionText
          required={SymptomSeverityConfig.required}
          subtext={t("surveyDescription:" + SymptomSeverityConfig.description)}
          text={t("surveyTitle:" + SymptomSeverityConfig.title)}
        />
        {this.state.severityConfigs.map((config: SurveyQuestionData) => {
          return (
            <ButtonGrid
              key={config.id}
              question={config}
              title={t("surveyDescription:" + config.description) + ":"}
              getAnswer={this.props.getAnswer}
              updateAnswer={this.props.updateAnswer}
            />
          );
        })}
      </Screen>
    ));
  }
}
export const WhenSymptoms = reduxWriter(
  withNamespaces("surveyScreen")(WhenSymptomsScreen)
);

class GeneralExposureScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  _questions = [
    InContactConfig,
    CoughSneezeConfig,
    YoungChildrenConfig,
    HouseholdChildrenConfig,
    ChildrenWithChildrenConfig,
    PeopleInHouseholdConfig,
    BedroomsConfig,
  ];

  _onNext = () => {
    this.props.navigation.push("GeneralHealth");
  };

  _canProceed = () => {
    return this._questions.reduce(
      (result, question) =>
        result &&
        (!question.required ||
          this.props.getAnswer("selectedButtonKey", question.id) != null),
      true
    );
  };

  render() {
    const width = Dimensions.get("window").width - 2 * GUTTER;
    const { t, getAnswer } = this.props;

    function conditionalQuestionFilter(question: SurveyQuestionData): boolean {
      switch (question.id) {
        case "CoughSneeze":
          return getAnswer("selectedButtonKey", InContactConfig.id) === "yes";
        default:
          return true;
      }
    }

    return timestampRender("GeneralExposureScreen", (
      <Screen
        canProceed={this._canProceed()}
        centerDesc={true}
        desc={t("description")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("generalExposure")}
        onNext={this._onNext}
      >
        <Divider />
        <Text content={t("expoDesc")} />
        <Image
          style={{ height: 0.65 * width, width, marginVertical: GUTTER }}
          source={require("../../img/expo.png")}
        />
        <Text
          content={t("expoRef")}
          italic={true}
          style={{ marginBottom: GUTTER }}
        />
        {this._questions
          .filter(conditionalQuestionFilter)
          .map(question => (
          <ButtonGrid
            key={question.id}
            question={question}
            getAnswer={this.props.getAnswer}
            updateAnswer={this.props.updateAnswer}
          />
        ))}
      </Screen>
    ));
  }
}
export const GeneralExposure = reduxWriter(
  withNamespaces("surveyScreen")(GeneralExposureScreen)
);

class GeneralHealthScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  _onNext = () => {
    this.props.navigation.push("ThankYouSurvey");
  };

  _canProceed = () => {
    return (
      this.props.getAnswer("selectedButtonKey", AntibioticsConfig.id) != null
    );
  };

  render() {
    const { t } = this.props;
    const gotFluShot = this.props.getAnswer("selectedButtonKey", FluShotConfig.id) === "yes";

    return timestampRender("GeneralHealthScreen", (
      <Screen
        canProceed={this._canProceed()}
        centerDesc={true}
        desc={t("description")}
        logo={false}
        navBar={true}
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
          buttonStyle={{ width: "50%" }}
          question={FluShotConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
        {
          gotFluShot &&
          <QuestionText text={t("surveyTitle:" + FluShotDateConfig.title)} />
        }
        {
          gotFluShot &&
          <MonthPicker
            date={this.props.getAnswer("dateInput", FluShotDateConfig.id)}
            onDateChange={dateInput =>
              this.props.updateAnswer({ dateInput }, FluShotDateConfig)
            }
          />
        }
        <ButtonGrid
          buttonStyle={{ width: "50%" }}
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
    ));
  }
}
export const GeneralHealth = reduxWriter(
  withNamespaces("surveyScreen")(GeneralHealthScreen)
);

interface StartTime {
  tenMinuteStartTime: number;
  isDemo: boolean;
}

@connect((state: StoreState) => ({
  tenMinuteStartTime: state.survey.tenMinuteStartTime,
}))
class ThankYouSurveyScreen extends React.Component<
  Props & StartTime & WithNamespaces
> {
  _onNext = () => {
    if (new Date().getTime() - this.props.tenMinuteStartTime > TEST_STRIP_MS) {
      this.props.navigation.push("TestStripReady");
    } else {
      this.props.navigation.push("TestStripTimer");
    }
  };

  render() {
    const { t } = this.props;
    return timestampRender("ThankYouSurveyScreen", (
      <Screen
        canProceed={true}
        desc={t("desc")}
        imageSrc={require("../../img/clipboard.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      />
    ));
  }
}
export const ThankYouSurvey = withNamespaces("thankYouSurveyScreen")<
  Props & StartTime
>(ThankYouSurveyScreen);

class TestStripReadyScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("TestStripReadyScreen", (
      <Screen
        canProceed={true}
        desc={t("desc")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("FinishTube");
        }}
      />
    ));
  }
}
export const TestStripReady = withNamespaces("testStripReadyScreen")<Props>(
  TestStripReadyScreen
);

interface TestStripTimerState {
  done: boolean;
  remaining: Date | null;
}

@connect((state: StoreState) => ({
  tenMinuteStartTime: state.survey.tenMinuteStartTime,
  isDemo: state.meta.isDemo
}))
class TestStripTimerScreen extends React.Component<
  Props & StartTime & WithNamespaces,
  TestStripTimerState
> {
  _timer: number | null | undefined;
  _willFocus: any;
  _fastForwardMillis: number;

  constructor(props: Props & StartTime & WithNamespaces) {
    super(props);
    this._fastForwardMillis = 0;
    const remaining = this._getRemaining(props.tenMinuteStartTime, this._fastForwardMillis);
    this.state = {
      remaining,
      done: remaining == null,
    };
  }

  // A debug function that forwards the timer to just having 5 secs left.
  _onFastForward(): void {
    this._fastForwardMillis =
      this.props.tenMinuteStartTime +
      TEST_STRIP_MS -
      new Date().getTime() -
      5 * SECOND_MS;
  }

  _getRemaining(startTime: number, fastForwardMillis: number): Date | null {
    const deltaMillis =
      startTime +
      TEST_STRIP_MS -
      new Date().getTime() -
      this._fastForwardMillis;
    if (deltaMillis > 0) {
      // @ts-ignore
      const remaining = new Date(null);
      remaining.setMilliseconds(deltaMillis);
      return remaining;
    } else {
      return null;
    }
  }

  componentDidMount() {
    if (!this.state.done) {
      this._willFocus = this.props.navigation.addListener("willFocus", () =>
        this._setTimer()
      );
    }
  }

  componentWillUnmount() {
    if (this._willFocus != null) {
      this._willFocus.remove();
    }
  }

  _setTimer() {
    if (this.props.navigation.isFocused() && !this.state.done) {
      setTimeout(() => {
        if (this.props.navigation.isFocused() && !this.state.done) {
          const remaining = this._getRemaining(this.props.tenMinuteStartTime, this._fastForwardMillis);
          this.setState({
            remaining,
            done: remaining == null,
          });
          this._setTimer();
        }
      }, 1000);
    }
  }

  render() {
    const { t } = this.props;
    return timestampRender("TestStripTimerScreen", (
      <Screen
        canProceed={this.state.done}
        desc={t("desc")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={
          this.state.done
            ? t("doneTitle")
            : t("title", {
                time: this.state.remaining!.toISOString().substr(14, 5),
              })
        }
        onNext={() => {
          this.props.navigation.push("FinishTube");
        }}
        onTitlePress={
          this.props.isDemo ? () => { this._onFastForward(); } : undefined
        }
      />
    ));
  }
}
export const TestStripTimer = withNamespaces("testStripTimerScreen")<
  Props & StartTime
>(TestStripTimerScreen);

class FinishTubeScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("FinishTubeScreen", (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("LookAtStrip");
        }}
      />
    ));
  }
}
export const FinishTube = withNamespaces("finishTubeScreen")<Props>(
  FinishTubeScreen
);

class LookAtStripScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("LookAtStripScreen", (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("TestStripSurvey");
        }}
      />
    ));
  }
}
export const LookAtStrip = withNamespaces("lookAtStripScreen")<Props>(
  LookAtStripScreen
);

class TestStripSurveyScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  render() {
    const { t } = this.props;
    return timestampRender("TestStripSurveyScreen", (
      <Screen
        canProceed={true}
        desc={t("desc")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("PictureInstructions");
        }}
      >
        <ButtonGrid
          buttonStyle={{ width: "50%" }}
          desc={true}
          question={BlueLineConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
        {this.props.getAnswer("selectedButtonKey", BlueLineConfig.id) ===
          "yes" && (
          <ButtonGrid
            question={RedWhenBlueConfig}
            vertical={true}
            getAnswer={this.props.getAnswer}
            updateAnswer={this.props.updateAnswer}
          />
        )}
        {this.props.getAnswer("selectedButtonKey", BlueLineConfig.id) ===
          "no" && (
          <ButtonGrid
            question={RedLineConfig}
            vertical={true}
            getAnswer={this.props.getAnswer}
            updateAnswer={this.props.updateAnswer}
          />
        )}
      </Screen>
    ));
  }
}
export const TestStripSurvey = reduxWriter(
  withNamespaces("testStripSurveyScreen")(TestStripSurveyScreen)
);

class PictureInstructionsScreen extends React.Component<
  Props & WithNamespaces
> {
  async _onNext() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    if (status === "granted") {
      this.props.navigation.push("TestStripCamera");
    } else {
      this.props.navigation.push("CleanFirstTest");
    }
  }

  render() {
    const { t } = this.props;
    return timestampRender("PictureInstructionsScreen", (
      <Screen
        canProceed={true}
        desc={t("desc")}
        imageSrc={require("../../img/phone.png")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={async () => {
          await this._onNext();
        }}
      />
    ));
  }
}
export const PictureInstructions = withNamespaces("pictureInstructionsScreen")(
  PictureInstructionsScreen
);

@connect()
class TestStripCameraScreen extends React.Component<Props & WithNamespaces> {
  camera = React.createRef<any>();

  state = {
    spinner: false,
  };

  async _takePicture() {
    const photo = await this.camera.current!.takePictureAsync({
      quality: 1,
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
    this.props.navigation.push("TestStripConfirmation");
  }

  render() {
    const { t } = this.props;
    return timestampRender("TestStripCameraScreen", (
      <View style={{ flex: 1 }}>
        <Spinner visible={this.state.spinner} />
        <Camera ref={this.camera} style={cameraStyles.camera} />
        <View style={cameraStyles.overlayContainer}>
          <Text
            center={true}
            content={t("title")}
            style={[cameraStyles.overlayText, { fontSize: LARGE_TEXT }]}
          />
          <View style={cameraStyles.targetBox}>
            <Image
              style={cameraStyles.testStrip}
              source={require("../../img/testStrip.png")}
            />
          </View>
          <Text
            center={true}
            content={t("description")}
            style={cameraStyles.overlayText}
          />
          <TouchableOpacity
            onPress={async () => {
              if (!this.state.spinner) {
                timestampInteraction("TestStripCameraScreen.takePicture");
                this.setState({ spinner: true });
                await this._takePicture();
              }
            }}
          >
            <View style={cameraStyles.outerCircle}>
              <View style={cameraStyles.circle} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    ));
  }
}
const cameraStyles = StyleSheet.create({
  camera: {
    alignSelf: "stretch",
    flex: 1,
    marginTop: STATUS_BAR_HEIGHT,
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
    textShadowColor: "rgba(0, 0, 0, 0.99)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  overlayContainer: {
    alignItems: "center",
    justifyContent: "space-between",
    left: 0,
    right: 0,
    margin: GUTTER,
    position: "absolute",
    top: STATUS_BAR_HEIGHT,
    bottom: 0,
  },
  targetBox: {
    alignItems: "center",
    borderColor: "white",
    borderRadius: 5,
    borderStyle: "dashed",
    borderWidth: 4,
    height: "45%",
    justifyContent: "center",
    width: "80%",
  },
  testStrip: {
    opacity: 0.5,
    height: 200,
    width: 100,
  },
});

export const TestStripCamera = withNamespaces("testStripCameraScreen")(
  TestStripCameraScreen
);

interface TestStripProps {
  testStripImg: SampleInfo;
}

@connect((state: StoreState) => ({
  testStripImg: state.survey.testStripImg,
}))
class TestStripConfirmationScreen extends React.Component<
  Props & TestStripProps & WithNamespaces
> {
  render() {
    const { t } = this.props;
    const screenWidth = Dimensions.get("window").width;
    const screenHeight = Dimensions.get("window").height;
    const height = screenHeight / 2;
    const width = (height * screenWidth) / screenHeight;
    return timestampRender("TestStripConfirmationScreen", (
      <Screen
        canProceed={true}
        desc={t("desc")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("CleanFirstTest");
        }}
      >
        <Image
          style={{ height, marginTop: GUTTER, width }}
          source={{
            uri: `data:image/gif;base64,${this.props.testStripImg.code}`,
          }}
        />
      </Screen>
    ));
  }
}
export const TestStripConfirmation = withNamespaces(
  "testStripConfirmationScreen"
)(TestStripConfirmationScreen);

class CleanFirstTestScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("CleanFirstTestScreen", (
      <Screen
        canProceed={true}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("FirstTestFeedback");
        }}
      >
        <BulletPoint content={t("step1")} />
        <BulletPoint content={t("step2")} />
        <BulletPoint content={t("step3")} />
        <BulletPoint content={t("step4")} />
        <BulletPoint content={t("step5")} />
      </Screen>
    ));
  }
}
export const CleanFirstTest = withNamespaces("cleanFirstTestScreen")<Props>(
  CleanFirstTestScreen
);

class FirstTestFeedbackScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  render() {
    const { t } = this.props;
    return timestampRender("FirstTestFeedbackScreen", (
      <Screen
        canProceed={true}
        imageSrc={require("../../img/mountain.png")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("BeginSecondTest");
        }}
      >
        <ButtonGrid
          desc={true}
          question={FirstTestFeedbackConfig}
          vertical={true}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
      </Screen>
    ));
  }
}
export const FirstTestFeedback = reduxWriter(
  withNamespaces("firstTestFeedbackScreen")(FirstTestFeedbackScreen)
);

class BeginSecondTestScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("BeginSecondTestScreen", (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("PrepSecondTest");
        }}
      />
    ));
  }
}
export const BeginSecondTest = withNamespaces("beginSecondTestScreen")<Props>(
  BeginSecondTestScreen
);

class PrepSecondTestScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("PrepSecondTestScreen", (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("MucusSecond");
        }}
      />
    ));
  }
}
export const PrepSecondTest = withNamespaces("prepSecondTestScreen")<Props>(
  PrepSecondTestScreen
);

class MucusSecondScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("MucusSecondScreen", (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/mucus.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("SwabInTubeSecond");
        }}
      />
    ));
  }
}
export const MucusSecond = withNamespaces("mucusSecondScreen")<Props>(
  MucusSecondScreen
);

class SwabInTubeSecondScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("SwabInTubeSecondScreen", (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("CleanSecondTest");
        }}
      />
    ));
  }
}
export const SwabInTubeSecond = withNamespaces("swabInTubeSecondScreen")<Props>(
  SwabInTubeSecondScreen
);

class CleanSecondTestScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("CleanSecondTestScreen", (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("SecondTestFeedback");
        }}
      />
    ));
  }
}
export const CleanSecondTest = withNamespaces("cleanSecondTestScreen")<Props>(
  CleanSecondTestScreen
);

class SecondTestFeedbackScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  render() {
    const { t } = this.props;
    return timestampRender("SecondTestFeedbackScreen", (
      <Screen
        canProceed={true}
        imageSrc={require("../../img/mountain.png")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("Packing");
        }}
      >
        <ButtonGrid
          desc={true}
          question={SecondTestFeedbackConfig}
          vertical={true}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
      </Screen>
    ));
  }
}
export const SecondTestFeedback = reduxWriter(
  withNamespaces("secondTestFeedbackScreen")(SecondTestFeedbackScreen)
);

class PackingScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("PackingScreen", (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={require("../../img/confirmation.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("Stickers");
        }}
      />
    ));
  }
}
export const Packing = withNamespaces("packingScreen")<Props>(PackingScreen);

class StickersScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("StickersScreen", (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("SecondBag");
        }}
      />
    ));
  }
}
export const Stickers = withNamespaces("stickersScreen")<Props>(StickersScreen);

class SecondBagScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("SecondBagScreen", (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("TapeBox");
        }}
      />
    ));
  }
}
export const SecondBag = withNamespaces("secondBagScreen")<Props>(
  SecondBagScreen
);

class TapeBoxScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("TapeBoxScreen", (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("ShipBox");
        }}
      />
    ));
  }
}
export const TapeBox = withNamespaces("tapeBoxScreen")<Props>(TapeBoxScreen);

class ShipBoxScreen extends React.Component<Props & WithNamespaces & ReduxWriterProps> {
  render() {
    const { t } = this.props;
    return timestampRender("ShipBoxScreen", (
      <Screen
        buttonLabel={t("schedulePickup")}
        canProceed={true}
        desc={t("description")}
        footer={
          <Button
            enabled={true}
            label={t("iWillDropOff")}
            primary={true}
            onPress={() => {
              this.props.navigation.push("GiftcardDetails");
            }}
          />
        }
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("SchedulePickup");
        }}
      >
        <Links
          links={[
            {
              label: t("showNearbyUsps"),
              onPress: () => {
                timestampInteraction("ShipBoxScreen.showNearbyShippingLocations");
                const addressInput = this.props.getAnswer("addressInput", AddressConfig.id);
                showNearbyShippingLocations(addressInput.zipcode);
              },
            },
          ]}
        />
      </Screen>
    ));
  }
}
export const ShipBox = reduxWriter(withNamespaces("shipBoxScreen")(ShipBoxScreen));

class SchedulePickupScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("SchedulePickupScreen", (
      <Screen
        buttonLabel={t("title")}
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          scheduleUSPSPickUp(() => {
            this.props.navigation.push("GiftcardDetails");
          });
        }}
      >
        <BulletPoint content={t("rule1")} />
        <BulletPoint content={t("rule2")} />
      </Screen>
    ));
  }
}
export const SchedulePickup = withNamespaces("schedulePickupScreen")<Props>(
  SchedulePickupScreen
);

interface EmailProps {
  email?: string;
}

interface EmailState {
  email?: string;
  validEmail: boolean;
}

@connect((state: StoreState) => ({
  email: state.survey.email,
}))
class GiftcardDetailsScreen extends React.Component<
  Props & EmailProps & WithNamespaces,
  EmailState
> {
  constructor(props: Props & EmailProps & WithNamespaces) {
    super(props);
    this.state = {
      email: props.email,
      validEmail: !!props.email,
    };
  }

  render() {
    const { t } = this.props;
    return timestampRender("GiftcardDetailsScreen", (
      <Screen
        canProceed={!!this.state.email && this.state.validEmail}
        desc={!!this.props.email ? t("descriptionWithEmail") : t("description")}
        footer={
          <Links
            center={true}
            links={[
              {
                label: t("optOut"),
                onPress: () => {
                  timestampInteraction("GiftcardDetailsScreen.optOut");
                  Alert.alert(t("confirm"), t("explanation"), [
                    {
                      text: t("noThanks"),
                      onPress: () => {
                        this.props.navigation.push("Thanks");
                      },
                    },
                    {
                      text: t("willEnter"),
                      onPress: () => {
                        timestampInteraction("GiftcardDetailsScreen.optOut.willEnter");
                      },
                    },
                  ]);
                },
              },
            ]}
          />
        }
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.dispatch(setEmail(this.state.email!));
          this.props.navigation.push("EmailOptIn");
        }}
      >
        <EmailInput
          autoFocus={this.props.navigation.isFocused()}
          placeholder={t("common:placeholder:enterEmail")}
          returnKeyType="next"
          validationError={t("common:validationErrors:email")}
          value={this.state.email}
          onChange={(email, validEmail) => this.setState({ email, validEmail })}
          onSubmit={validEmail => this.setState({ validEmail })}
        />
      </Screen>
    ));
  }
}
export const GiftcardDetails = withNamespaces("giftcardDetailsScreen")<
  Props & EmailProps
>(GiftcardDetailsScreen);

class EmailOptInScreen extends React.Component<
  Props & WorkflowProps & WithNamespaces & ReduxWriterProps
> {
  render() {
    const { t } = this.props;
    return timestampRender("EmailOptInScreen", (
      <Screen
        buttonLabel={t("common:button:continue")}
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.dispatch(
            setWorkflow({
              ...this.props.workflow,
              surveyComplete: true,
            })
          );
          this.props.navigation.push("Thanks");
        }}
      >
        <OptionList
          data={newSelectedOptionsList(
            OptInForMessagesConfig.optionList!.options,
            this.props.getAnswer("options", OptInForMessagesConfig.id)
          )}
          multiSelect={true}
          numColumns={1}
          onChange={options =>
            this.props.updateAnswer({ options }, OptInForMessagesConfig)
          }
        />
      </Screen>
    ));
  }
}
export const EmailOptIn = reduxWriter(
  withNamespaces("emailOptInScreen")(EmailOptInScreen)
);

class ThanksScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender("ThanksScreen", (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("title")}
        onNext={() => {}}
      >
        <Links
          links={[
            {
              label: t("links:learnLink"),
              onPress: () => {
                timestampInteraction("ThanksScreen.links:learnLink");
                learnMore();
              },
            },
            {
              label: t("links:medLink"),
              onPress: () => {
                timestampInteraction("ThanksScreen.links:medLink");
                findMedHelp();
              },
            },
          ]}
        />
        <Text content={t("disclaimer")} style={{ marginBottom: GUTTER }} />
      </Screen>
    ));
  }
}
export const Thanks = withNamespaces("thanksScreen")<Props>(ThanksScreen);
