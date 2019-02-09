import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { SampleInfo } from "audere-lib/feverProtocol";
import { Action, setKitBarcode, startSurvey, StoreState } from "../store";
import BorderView from "./components/BorderView";
import Button from "./components/Button";
import ImageText from "./components/ImageText";
import Screen from "./components/Screen";
import Links from "./components/Links";
import Text from "./components/Text";
import TextInput from "./components/TextInput";
import Title from "./components/Title";
import { BarCodeScanner, Permissions } from "expo";

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
        imageSrc={require("../img/welcome.png")}
        logo={true}
        navBar={false}
        navigation={this.props.navigation}
        title={t("welcomeBack")}
        onNext={() => {
          this.props.dispatch(startSurvey());
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
        imageSrc={require("../img/why.png")}
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
        <View>
          <ImageText
            imageSrc={require("../img/soap.png")}
            text={t("washStep")}
          />
          <ImageText
            imageSrc={require("../img/water.png")}
            text={t("waterStep")}
          />
          <ImageText
            imageSrc={require("../img/cat.png")}
            text={t("flatStep")}
          />
        </View>
      </Screen>
    );
  }
}
const Before = withNamespaces("beforeScreen")<Props>(BeforeScreen);

class ScanInstructionsScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <Screen
        alignTop={true}
        buttonLabel={t("okScan")}
        canProceed={true}
        desc={t("description")}
        footer={
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
        }
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("scanQrCode")}
        onNext={async () => {
          const { status } = await Permissions.askAsync(Permissions.CAMERA);
          if (status === "granted") {
            this.props.navigation.push("Scan");
          } else {
            this.props.navigation.push("WhyCamera");
          }
        }}
      >
        <BorderView>
          <Image
            style={{ height: 180, width: 250 }}
            source={require("../img/barcodeBox.png")}
          />
        </BorderView>
        <View>
          <Text bold={true} content={t("tips")} />
          <Text content={t("holdCamera")} />
          <Text content={t("lighting")} />
        </View>
      </Screen>
    );
  }
}
const ScanInstructions = withNamespaces("scanInstructionsScreen")<Props>(
  ScanInstructionsScreen
);

@connect()
class ScanScreen extends React.Component<Props & WithNamespaces> {
  state = {
    activeScan: false,
  };

  componentDidMount() {
    // Timeout after 30 seconds
    setTimeout(() => {
      this.props.navigation.push("ManualEntry");
    }, 30000);
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
            <Text content={t("enterManually")} style={scanStyles.overlayText} />
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
const Scan = withNamespaces("scanScreen")<Props>(ScanScreen);

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
        buttonLabel={t("continue")}
        canProceed={true}
        imageSrc={require("../img/phoneBarcode.png")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("codeSent")}
        onNext={() => {
          this.props.navigation.push("TestOne");
        }}
      >
        <BorderView>
          <Text
            center={true}
            content={t("yourCode") + this.props.kitBarcode.code}
          />
        </BorderView>
        <Text content={t("description")} />
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
        buttonLabel={t("continue")}
        canProceed={true}
        imageSrc={require("../img/phoneBarcode.png")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("codeSent")}
        onNext={() => {
          this.props.navigation.push("TestOne");
        }}
      >
        <BorderView>
          <Text
            center={true}
            content={t("yourCode") + this.props.kitBarcode.code}
          />
        </BorderView>
        <Text content={t("description")} />
        <Text content={t("nextStep")} />
      </Screen>
    );
  }
}
const ManualConfirmation = withNamespaces("manualConfirmationScreen")<
  Props & BarcodeProps
>(ScanConfirmationScreen);

@connect()
class ManualEntryScreen extends React.Component<Props & WithNamespaces> {
  state = {
    barcode1: null,
    barcode2: null,
  };

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
      this.props.navigation.push("ManualConfirmation");
    }
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("continue")}
        canProceed={this._validBarcodes()}
        logo={true}
        navBar={true}
        navigation={this.props.navigation}
        title={t("enterKit")}
        onNext={this._onSave}
      >
        <View style={{ width: 200 }}>
          <TextInput
            autoCorrect={false}
            autoFocus={true}
            placeholder="Enter barcode data"
            returnKeyType="next"
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
        </View>
      </Screen>
    );
  }
}
const ManualEntry = withNamespaces("manualEntryScreen")<Props>(
  ManualEntryScreen
);

class TestOneScreen extends React.Component<Props & WithNamespaces> {
  // TODO content
  render() {
    const { t } = this.props;
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Title label="Test One" />
        <Button
          enabled={true}
          label="Next"
          primary={true}
          onPress={() => {
            // this.props.navigation.push("Scan");
          }}
        />
      </View>
    );
  }
}
const TestOne = withNamespaces("testOneScreen")<Props>(TestOneScreen);

export {
  WelcomeBack,
  WhatsNext,
  Before,
  ScanInstructions,
  Scan,
  ScanConfirmation,
  ManualEntry,
  ManualConfirmation,
  TestOne,
};
