import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { Alert, StyleSheet, Text, View } from "react-native";
import { connect } from "react-redux";
import { Action, StoreState, setGiftcards } from "../../../store";
import { GiftCardInfo } from "audere-lib";
import BackButton from "../../components/BackButton";
import Button from "../../components/Button";
import FeedbackButton from "../../components/FeedbackButton";
import FeedbackModal from "../../components/FeedbackModal";
import { AppLoading, BarCodeScanner, Permissions } from "expo";

interface Props {
  dispatch(action: Action): void;
  giftcards: GiftCardInfo[];
  name: string;
  navigation: NavigationScreenProp<any, any>;
}

@connect((state: StoreState) => ({
  name: state.form.name,
  giftcards: state.form.giftcards,
}))
export default class GiftCardScreen extends React.Component<Props> {
  static navigationOptions = ({
    navigation,
  }: {
    navigation: NavigationScreenProp<any, any>;
  }) => {
    const { params = null } = navigation.state;
    return {
      headerLeft: (
        <BackButton navigation={navigation} text={"Gift Card Type"} />
      ),
      title: "Gift Card Scan",
      headerRight: !!params ? (
        <FeedbackButton onPress={params.showFeedback} />
      ) : null,
    };
  };

  state = {
    activeScan: false,
    feedbackVisible: false,
    hasCameraPermission: null,
  };

  async componentDidMount() {
    this.props.navigation.setParams({
      showFeedback: () => this.setState({ feedbackVisible: true }),
    });
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === "granted" });
  }

  _onHelp = () => {
    Alert.alert(
      "Scanning Instructions",
      "Hold the barcode about 6 inches away from the iPad until the text is in clear focus. An alert will pop up when the barcode is successfully scanned. If scanning isn't working, you can enter the barcode data manually.",
      [
        {
          text: "OK",
          onPress: () => {},
        },
      ]
    );
  };

  _onManualEntry = () => {
    this.props.navigation.push("ManualGiftCard", {
      giftcardType: this.props.navigation.getParam("giftcardType"),
    });
  };

  handleBarCodeScanned = ({ type, data }: { type: any; data: string }) => {
    const giftcards = !!this.props.giftcards
      ? this.props.giftcards.slice(0)
      : [];
    giftcards.push({
      barcodeType: type.toString(),
      code: data,
      giftcardType: this.props.navigation.getParam("giftcardType"),
    });
    Alert.alert(
      `Submit ${data} ?`,
      `Gift card ${data} will be recorded for ${this.props.name}.`,
      [
        {
          text: "Cancel",
          onPress: () => {
            this.setState({ activeScan: false });
          },
        },
        {
          text: "OK",
          onPress: () => {
            this.setState({ activeScan: false });
            this.props.dispatch(setGiftcards(giftcards));
            this.props.navigation.popToTop();
          },
        },
      ]
    );
  };

  render() {
    const { hasCameraPermission } = this.state;

    return hasCameraPermission === null ? (
      <AppLoading />
    ) : (
      <View style={styles.container}>
        <FeedbackModal
          visible={this.state.feedbackVisible}
          onDismiss={() => this.setState({ feedbackVisible: false })}
        />
        {hasCameraPermission ? (
          <View style={{ flex: 1 }}>
            <BarCodeScanner
              style={{ flex: 1, alignSelf: "stretch" }}
              onBarCodeScanned={({
                type,
                data,
              }: {
                type: any;
                data: string;
              }) => {
                if (!this.state.activeScan) {
                  this.setState({ activeScan: true });
                  this.handleBarCodeScanned({ type, data });
                }
              }}
            />
            <View
              style={{ flexDirection: "row", justifyContent: "space-around" }}
            >
              <Button
                enabled={true}
                key="help"
                label="Help"
                primary={true}
                onPress={this._onHelp}
              />
              <Button
                enabled={true}
                key="manual"
                label="Enter Manually"
                primary={true}
                onPress={this._onManualEntry}
              />
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.headerText}>Camera Permission Required</Text>
            <Text style={styles.bodyText}>
              Grant permission in this iPad's Settings app under Flu@home.
            </Text>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  headerText: {
    alignSelf: "center",
    fontSize: 24,
    margin: 15,
  },
  bodyText: {
    alignSelf: "center",
    fontSize: 20,
  },
});
