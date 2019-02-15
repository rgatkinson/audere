import React from "react";
import {
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
} from "../../resources/ScreenConfig";
import reduxWriter, { ReduxWriterProps } from "../../store/ReduxWriter";
import BorderView from "../components/BorderView";
import BulletPoint from "../components/BulletPoint";
import Button from "../components/Button";
import ButtonGrid from "../components/ButtonGrid";
import Divider from "../components/Divider";
import ImageGrid from "../components/ImageGrid";
import ImageText from "../components/ImageText";
import MonthPicker from "../components/MonthPicker";
import Links from "../components/Links";
import OptionQuestion from "../components/OptionQuestion";
import QuestionText from "../components/QuestionText";
import Screen from "../components/Screen";
import Text from "../components/Text";
import TextInput from "../components/TextInput";
import Title from "../components/Title";
import { GUTTER, LARGE_TEXT, STATUS_BAR_HEIGHT } from "../styles";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

@connect()
class WelcomeBackScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
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
    );
  }
}
export const WelcomeBack = withNamespaces("welcomeBackScreen")<Props>(
  WelcomeBackScreen
);

class WhatsNextScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageSrc={require("../../img/why.png")}
        logo={true}
        navBar={false}
        navigation={this.props.navigation}
        title={t("whatsNext")}
        onNext={() => {
          this.props.navigation.push("Before");
        }}
      />
    );
  }
}
export const WhatsNext = withNamespaces("whatsNextScreen")<Props>(
  WhatsNextScreen
);

class BeforeScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
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
    );
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
    return (
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
    );
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
  _timer: number | null | undefined;

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
    return (
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
    return (
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
    );
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
    return (
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
    );
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
    return !!this.state.barcode1 && this.state.barcode1 === this.state.barcode2;
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
    return (
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
            autoCorrect={false}
            keyboardType={"number-pad"}
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
            keyboardType={"number-pad"}
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
    );
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
    return (
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
    );
  }
}
export const TestInstructions = withNamespaces("testInstructionsScreen")<Props>(
  TestInstructionsScreen
);

class ComponentsScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("common:button:continue")}
        canProceed={true}
        desc={t("description")}
        navBar={true}
        navigation={this.props.navigation}
        skipButton={true}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("Swab");
        }}
      >
        <ImageGrid
          columns={2}
          items={[
            {
              imageSrc: require("../../img/kit.png"),
              label: t("kit"),
            },
            {
              imageSrc: require("../../img/card.png"),
              label: t("card"),
            },
            {
              imageSrc: require("../../img/sampleTube.png"),
              label: t("sampleTube"),
            },
            {
              imageSrc: require("../../img/ampoule.png"),
              label: t("ampoule"),
            },
            {
              imageSrc: require("../../img/swab.png"),
              label: t("swab"),
            },
            {
              imageSrc: require("../../img/bag.png"),
              label: t("bag"),
            },
          ]}
        />
        <Button
          enabled={true}
          primary={true}
          label={t("common:button:continue")}
          onPress={() => this.props.navigation.push("Swab")}
        />
        <Links
          center={true}
          links={[
            {
              label: t("help"),
              onPress: () => {},
            },
          ]}
        />
      </Screen>
    );
  }
}
export const Components = withNamespaces("componentsScreen")<Props>(
  ComponentsScreen
);

class SwabScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
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
    );
  }
}
export const Swab = withNamespaces("swabScreen")<Props>(SwabScreen);

class SwabPrepScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
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
    );
  }
}
export const SwabPrep = withNamespaces("swabPrepScreen")<Props>(SwabPrepScreen);

class MucusScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
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
          this.props.navigation.push("FirstTimer");
        }}
      />
    );
  }
}
export const Mucus = withNamespaces("mucusScreen")<Props>(MucusScreen);

// TODO swab in tube

class FirstTimerScreen extends React.Component<Props & WithNamespaces> {
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
    return (
      <Screen
        canProceed={this._canProceed()}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title", { time: this.state.time })}
        onNext={() => {}}
      >
        <Text content={t("tip")} />
      </Screen>
    );
  }
}
export const FirstTimer = withNamespaces("firstTimerScreen")<Props>(
  FirstTimerScreen
);

class FirstTimerDoneScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("StripInTube");
        }}
      >
        <Text content={t("tip")} />
      </Screen>
    );
  }
}
export const FirstTimerDone = withNamespaces("firstTimerDoneScreen")<Props>(
  FirstTimerDoneScreen
);

// TODO remove swab
// TODO open test strip

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
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      />
    );
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
    return (
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
    );
  }
}
export const WhatSymptoms = reduxWriter(
  withNamespaces("surveyScreen")(WhatSymptomsScreen)
);

class WhenSymptomsScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  _onNext = () => {
    this.props.navigation.push("GeneralExposure");
  };

  _canProceed = () => {
    // TODO: all questions answered
    return true;
  };

  render() {
    const symptomsStartConfigs = this.props
      .getAnswer("options", WhatSymptomsConfig.id)
      .filter((option: Option) => option.selected)
      .map((option: Option) => {
        return {
          buttons: SymptomsStartConfig.buttons,
          description: option.key,
          id: SymptomsStartConfig.id + "_" + option.key,
          required: true,
          title: SymptomsStartConfig.title,
        };
      });

    const last48Configs = this.props
      .getAnswer("options", WhatSymptomsConfig.id)
      .filter((option: Option) => option.selected)
      .map((option: Option) => {
        return {
          buttons: Last48Config.buttons,
          description: option.key,
          id: Last48Config.id + "_" + option.key,
          required: true,
          title: Last48Config.title,
        };
      });

    const severityConfigs = this.props
      .getAnswer("options", WhatSymptomsConfig.id)
      .filter((option: Option) => option.selected)
      .map((option: Option) => {
        return {
          buttons: SymptomSeverityConfig.buttons,
          description: option.key,
          id: SymptomSeverityConfig.id + "_" + option.key,
          required: true,
          title: SymptomSeverityConfig.title,
        };
      });

    const { t } = this.props;
    return (
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
          text={t("surveyTitle:" + SymptomsStartConfig.title)}
          subtext={t("surveyDescription:" + SymptomsStartConfig.description)}
        />
        {symptomsStartConfigs.map((config: SurveyQuestionData) => {
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
          text={t("surveyTitle:" + Last48Config.title)}
          subtext={t("surveyDescription:" + Last48Config.description)}
        />
        {last48Configs.map((config: SurveyQuestionData) => {
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
          text={t("surveyTitle:" + SymptomSeverityConfig.title)}
          subtext={t("surveyDescription:" + SymptomSeverityConfig.description)}
        />
        {severityConfigs.map((config: SurveyQuestionData) => {
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
    );
  }
}
export const WhenSymptoms = reduxWriter(
  withNamespaces("surveyScreen")(WhenSymptomsScreen)
);

class GeneralExposureScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  _onNext = () => {
    this.props.navigation.push("GeneralHealth");
  };

  _canProceed = () => {
    // TODO: all required questions are answered
    return true;
  };

  render() {
    const width = Dimensions.get("window").width - 2 * GUTTER;
    const { t } = this.props;
    return (
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
        <ButtonGrid
          question={InContactConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
        <ButtonGrid
          question={CoughSneezeConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
        <ButtonGrid
          question={YoungChildrenConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
        <ButtonGrid
          question={HouseholdChildrenConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
        <ButtonGrid
          question={ChildrenWithChildrenConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
        <ButtonGrid
          question={PeopleInHouseholdConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
        <ButtonGrid
          question={BedroomsConfig}
          getAnswer={this.props.getAnswer}
          updateAnswer={this.props.updateAnswer}
        />
      </Screen>
    );
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
    // TODO: all required questions are answered
    return true;
  };

  render() {
    const { t } = this.props;
    return (
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
        <QuestionText text={t("surveyTitle:" + FluShotDateConfig.title)} />
        <MonthPicker
          date={this.props.getAnswer("dateInput", FluShotDateConfig.id)}
          onDateChange={dateInput =>
            this.props.updateAnswer({ dateInput }, FluShotDateConfig)
          }
        />
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
    );
  }
}
export const GeneralHealth = reduxWriter(
  withNamespaces("surveyScreen")(GeneralHealthScreen)
);

interface StartTime {
  tenMinuteStartTime: number;
}

@connect((state: StoreState) => ({
  tenMinuteStartTime: state.survey.tenMinuteStartTime,
}))
class ThankYouSurveyScreen extends React.Component<
  Props & StartTime & WithNamespaces
> {
  _onNext = () => {
    const MILLIS_IN_SECOND = 1000.0;
    const SECONDS_IN_MINUTE = 60;

    const intervalMilis = new Date().getTime() - this.props.tenMinuteStartTime;
    const elapsedMinutes =
      intervalMilis / (MILLIS_IN_SECOND * SECONDS_IN_MINUTE);
    if (elapsedMinutes > 10) {
      this.props.navigation.push("TestStripReady");
    } else {
      this.props.navigation.push("TestStripTimer");
    }
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("desc")}
        imageSrc={require("../../img/clipboard.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      />
    );
  }
}
export const ThankYouSurvey = withNamespaces("thankYouSurveyScreen")<
  Props & StartTime
>(ThankYouSurveyScreen);

class TestStripReadyScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("desc")}
        imageBorder={true}
        imageSrc={require("../../img/tbd.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("TestStripSurvey");
        }}
      />
    );
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
}))
class TestStripTimerScreen extends React.Component<
  Props & StartTime & WithNamespaces,
  TestStripTimerState
> {
  _timer: number | null | undefined;
  _willFocus: any;

  constructor(props: Props & StartTime & WithNamespaces) {
    super(props);
    const remaining = this._getRemaining(props.tenMinuteStartTime);
    this.state = {
      remaining,
      done: remaining == null,
    };
  }

  _getRemaining(startTime: number): Date | null {
    const MILLIS_IN_SECOND = 1000.0;
    const SECONDS_IN_MINUTE = 60;
    const deltaMillis =
      startTime +
      MILLIS_IN_SECOND * SECONDS_IN_MINUTE * 10 -
      new Date().getTime();
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
          const remaining = this._getRemaining(this.props.tenMinuteStartTime);
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
    return (
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
          this.props.navigation.push("TestStripSurvey");
        }}
      />
    );
  }
}
export const TestStripTimer = withNamespaces("testStripTimerScreen")<
  Props & StartTime
>(TestStripTimerScreen);

// TODO finish with tube
// TODO look at strip

class TestStripSurveyScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  render() {
    const { t } = this.props;
    return (
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
    );
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
    return (
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
    );
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
    let photo = await this.camera.current!.takePictureAsync({
      quality: 1,
      base64: true,
      orientation: "portrait",
      fixOrientation: true,
    });
    this.props.dispatch(
      setTestStripImg({
        sample_type: "TestStripBase64",
        code: photo.base64,
      })
    );
    this.setState({ spinner: false });
    this.props.navigation.push("TestStripConfirmation");
  }

  render() {
    const { t } = this.props;
    return (
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
    );
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
  // TODO: in case of error, show error message with options to try again or skip
  render() {
    const { t } = this.props;
    const screenWidth = Dimensions.get("window").width;
    const screenHeight = Dimensions.get("window").height;
    const height = screenHeight / 2;
    const width = (height * screenWidth) / screenHeight;
    return (
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
    );
  }
}
export const TestStripConfirmation = withNamespaces(
  "testStripConfirmationScreen"
)(TestStripConfirmationScreen);

class CleanFirstTestScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
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
    );
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
    return (
      <Screen
        canProceed={true}
        imageSrc={require("../../img/mountain.png")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("SecondTestFeedback");
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
    );
  }
}
export const FirstTestFeedback = reduxWriter(
  withNamespaces("firstTestFeedbackScreen")(FirstTestFeedbackScreen)
);

// TODO begin second test
// TODO prep second test
// TODO collect mucus
// TODO swab in tub
// TODO clean up

class SecondTestFeedbackScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        imageSrc={require("../../img/mountain.png")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={() => {
          this.props.navigation.push("SecondTestFeedback");
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
    );
  }
}
export const SecondTestFeedback = reduxWriter(
  withNamespaces("secondTestFeedbackScreen")(SecondTestFeedbackScreen)
);

// TODO pack up
// TODO stickers
// TODO bag in box
// TODO tape box
// TODO shipping choice
// TODO schedule pick up instructions
// TODO schedule pick up behavior
// TODO email input for gift card
// TODO email opt ins
// TODO thank you screen
