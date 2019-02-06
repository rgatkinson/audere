import React from "react";
import {
  Alert,
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { Action } from "../store";
import reduxWriter, { ReduxWriterProps } from "../store/ReduxWriter";
import Button from "./components/Button";
import ImageText from "./components/ImageText";
import Screen from "./components/Screen";
import Links from "./components/Links";
import Text from "./components/Text";
import Title from "./components/Title";
import { BarCodeScanner, Permissions } from "expo";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

@connect()
class WelcomeBackScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    // TODO: start screening form
    this.props.navigation.push("WhatsNext");
  };

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
        onNext={this._onNext}
      />
    );
  }
}
const WelcomeBack = withNamespaces("welcomeBackScreen")<Props>(
  WelcomeBackScreen
);

class WhatsNextScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("Before");
  };

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
        onNext={this._onNext}
      />
    );
  }
}
const WhatsNext = withNamespaces("whatsNextScreen")<Props>(WhatsNextScreen);

class BeforeScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("ScanInstructions");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        logo={true}
        navBar={false}
        navigation={this.props.navigation}
        title={t("beforeYouBegin")}
        onNext={this._onNext}
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
  // TODO update links
  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("okScan")}
        canProceed={true}
        desc={t("description")}
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
        <Links />
        <Image
          style={{ height: 216, width: 300 }}
          source={require("../img/qrCode.png")}
        />
      </Screen>
    );
  }
}
const ScanInstructions = withNamespaces("scanInstructionsScreen")<Props>(
  ScanInstructionsScreen
);

class ScanScreen extends React.Component<Props & WithNamespaces> {
  state = {
    activeScan: false,
  };

  // TODO: timeout to trigger entering manually
  render() {
    const { t } = this.props;
    return (
      <View style={{ flex: 1 }}>
        <BarCodeScanner
          style={{ flex: 1, alignSelf: "stretch" }}
          onBarCodeScanned={({ type, data }: { type: any; data: string }) => {
            if (!this.state.activeScan) {
              this.setState({ activeScan: true });
              // TODO save barcode
              this.props.navigation.push("ScanConfirmation");
            }
          }}
        />
        <View style={scanStyles.instructionContainer}>
          <TouchableOpacity
            style={scanStyles.instructions}
            onPress={() => {
              this.props.navigation.push("ManualEntry");
            }}
          >
            <Title label={t("enterManually")} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}
const scanStyles = StyleSheet.create({
  instructions: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 6,
    height: 75,
    justifyContent: "center",
    width: 300,
    opacity: 0.5,
  },
  instructionContainer: {
    alignItems: "center",
    height: 125,
    left: 0,
    justifyContent: "center",
    position: "absolute",
    top: 0,
    width: Dimensions.get("window").width,
  },
});
const Scan = withNamespaces("scanScreen")<Props>(ScanScreen);

class ScanConfirmationScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("continue")}
        canProceed={true}
        desc={t("description")}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("codeSent")}
        onNext={() => {
          this.props.navigation.push("TestOne");
        }}
      />
    );
  }
}
const ScanConfirmation = withNamespaces("scanConfirmationScreen")<Props>(
  ScanConfirmationScreen
);

class ManualEntryScreen extends React.Component<Props & WithNamespaces> {
  // TODO: barcode entry fields
  // TODO: save barcodes
  _haveBarcodes = () => {
    return true;
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        buttonLabel={t("continue")}
        canProceed={this._haveBarcodes()}
        logo={false}
        navBar={true}
        navigation={this.props.navigation}
        title={t("enterKit")}
        onNext={() => {
          this.props.navigation.push("TestOne");
        }}
      />
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
  TestOne,
};
