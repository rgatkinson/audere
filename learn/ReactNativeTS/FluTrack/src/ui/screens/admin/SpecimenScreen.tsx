import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { Alert, StyleSheet, Text, View } from "react-native";
import { connect } from "react-redux";
import { Action, Sample, StoreState, setSamples } from "../../../store";
import BackButton from "../../components/BackButton";
import Button from "../../components/Button";
import FeedbackButton from "../../components/FeedbackButton";
import FeedbackModal from "../../components/FeedbackModal";
import { AppLoading, BarCodeScanner, Permissions } from "expo";

interface Props {
  dispatch(action: Action): void;
  name: string;
  navigation: NavigationScreenProp<any, any>;
  samples: Sample[];
}

@connect((state: StoreState) => ({
  name: state.form.name,
  samples: state.form.samples,
}))
export default class SpecimentScreen extends React.Component<Props> {
  static navigationOptions = ({
    navigation,
  }: {
    navigation: NavigationScreenProp<any, any>;
  }) => {
    const { params = null } = navigation.state;
    return {
      headerLeft: (
        <BackButton navigation={navigation} text={"Admin Settings"} />
      ),
      title: "Specimen Scan",
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
    this.props.navigation.push("ManualBarcode");
  };

  handleBarCodeScanned = ({ type, data }: { type: any; data: string }) => {
    const samples = !!this.props.samples ? this.props.samples.slice(0) : [];
    samples.push({ sampleType: type.toString(), code: data });
    Alert.alert(
      `Submit ${data} ?`,
      `Barcode ${data} will be recorded for ${this.props.name}.`,
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
            this.props.dispatch(setSamples(samples));
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
              Grant permission in this iPad's Settings app under FluTrack.
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
