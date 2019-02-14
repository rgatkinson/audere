import React from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { BarCodeScanner, Permissions } from "expo";
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
} from "../../resources/ScreenConfig";
import reduxWriter, { ReduxWriterProps } from "../../store/ReduxWriter";
import BorderView from "../components/BorderView";
import BulletPoint from "../components/BulletPoint";
import Button from "../components/Button";
import ButtonGrid from "../components/ButtonGrid";
import Divider from "../components/Divider";
import ImageGrid from "../components/ImageGrid";
import ImageText from "../components/ImageText";
import OptionList, { newSelectedOptionsList } from "../components/OptionList";
import Links from "../components/Links";
import QuestionText from "../components/QuestionText";
import Screen from "../components/Screen";
import Text from "../components/Text";
import TextInput from "../components/TextInput";
import Title from "../components/Title";
import { GUTTER } from "../styles";

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
const WelcomeBack = withNamespaces("welcomeBackScreen")<Props>(
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
const WhatsNext = withNamespaces("whatsNextScreen")<Props>(WhatsNextScreen);

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
const Before = withNamespaces("beforeScreen")<Props>(BeforeScreen);

class ScanInstructionsScreen extends React.Component<Props & WithNamespaces> {
  async _onNext() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    if (status === "granted") {
      this.props.navigation.push("Scan");
    } else {
      this.props.navigation.push("WhyCamera");
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
        <Text
          bold={true}
          content={t("tips")}
          style={{ marginBottom: GUTTER / 2 }}
        />
        <Text content={t("holdCamera")} style={{ marginBottom: GUTTER / 2 }} />
        <Text content={t("lighting")} style={{ marginBottom: GUTTER }} />
      </Screen>
    );
  }
}
const ScanInstructions = withNamespaces("scanInstructionsScreen")<Props>(
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
const Scan = withNamespaces("scanScreen")<Props & WorkflowProps>(ScanScreen);

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
const ScanConfirmation = withNamespaces("scanConfirmationScreen")<
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
const ManualConfirmation = withNamespaces("manualConfirmationScreen")<
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
    return (
      <Screen
        buttonLabel={t("common:button:continue")}
        canProceed={this._validBarcodes()}
        logo={true}
        navBar={true}
        navigation={this.props.navigation}
        title={t("enterKit")}
        onNext={this._onSave}
      >
        <TextInput
          autoCorrect={false}
          autoFocus={true}
          placeholder="Enter barcode data"
          returnKeyType="next"
          style={{ marginVertical: GUTTER }}
          value={this.state.barcode1}
          onChangeText={(text: string) => {
            this.setState({ barcode1: text });
          }}
          onSubmitEditing={() => this.confirmInput.current!.focus()}
        />
        <TextInput
          autoCorrect={false}
          placeholder="Confirm barcode data"
          ref={this.confirmInput}
          returnKeyType="done"
          value={this.state.barcode2}
          onChangeText={(text: string) => {
            this.setState({ barcode2: text });
          }}
          onSubmitEditing={this._onSave}
        />
      </Screen>
    );
  }
}
const ManualEntry = withNamespaces("manualEntryScreen")<
  Props & BarcodeProps & WorkflowProps
>(ManualEntryScreen);

class TestInstructionsScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("Components");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("common:button:continue")}
        canProceed={true}
        desc={t("description")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("title")}
        onNext={this._onNext}
      >
        <BulletPoint content={t("step1")} />
        <BulletPoint content={t("step2")} />
        <BulletPoint content={t("step3")} />
        <BulletPoint content={t("step4")} />
        <BulletPoint content={t("step5")} />
        <BulletPoint content={t("step6")} />
        <BulletPoint content={t("step7")} />
        <BulletPoint content={t("step8")} />
        <BulletPoint content={t("step9")} />
      </Screen>
    );
  }
}
const TestInstructions = withNamespaces("testInstructionsScreen")<Props>(
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
              onPress: () => {
                // TODO kit help
                // this.props.navigation.push();
              },
            },
          ]}
        />
      </Screen>
    );
  }
}
const Components = withNamespaces("componentsScreen")<Props>(ComponentsScreen);

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
const Swab = withNamespaces("swabScreen")<Props>(SwabScreen);

class SwabPrepScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        imageBorder={true}
        imageSrc={require("../../img/swabPrep.png")}
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
const SwabPrep = withNamespaces("swabPrepScreen")<Props>(SwabPrepScreen);

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
          this.props.navigation.push("WhatSymptoms");
        }}
      />
    );
  }
}
const Mucus = withNamespaces("mucusScreen")<Props>(MucusScreen);

class WhatSymptomsScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  _onNext = () => {
    this.props.updateAnswer({ selectedButtonKey: "next" }, WhatSymptomsConfig);
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
        <QuestionText
          text={t("surveyTitle:" + WhatSymptomsConfig.title)}
          subtext={t("surveyDescription:" + WhatSymptomsConfig.description)}
        />
        <OptionList
          data={newSelectedOptionsList(
            WhatSymptomsConfig.optionList!.options,
            this.props.getAnswer("options", WhatSymptomsConfig.id)
          )}
          multiSelect={true}
          numColumns={1}
          onChange={symptoms =>
            this.props.updateAnswer({ options: symptoms }, WhatSymptomsConfig)
          }
        />
      </Screen>
    );
  }
}
const WhatSymptoms = reduxWriter(
  withNamespaces("surveyScreen")(WhatSymptomsScreen)
);

class WhenSymptomsScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  _onNext = () => {
    // TODO: will our uploader save our answer if we don't have a button label?
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
              key={config.id}
              question={config}
              style={{ width: "50%" }}
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
const WhenSymptoms = reduxWriter(
  withNamespaces("surveyScreen")(WhenSymptomsScreen)
);

class GeneralExposureScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  _onNext = () => {
    this.props.navigation.push("WelcomeBack");
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
        title={t("generalExposure")}
        onNext={this._onNext}
      >
        <Divider />
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
const GeneralExposure = reduxWriter(
  withNamespaces("surveyScreen")(GeneralExposureScreen)
);

export {
  WelcomeBack,
  WhatsNext,
  Before,
  ScanInstructions,
  Scan,
  ScanConfirmation,
  ManualEntry,
  ManualConfirmation,
  TestInstructions,
  Components,
  Swab,
  SwabPrep,
  Mucus,
  WhatSymptoms,
  WhenSymptoms,
  GeneralExposure,
};
