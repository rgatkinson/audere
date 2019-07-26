import React from "react";
import { StyleSheet, View } from "react-native";
import { PermissionsAndroid } from "react-native";
import { connect } from "react-redux";
import { viewDetails, Action, StoreState } from "../store";
import Text from "./components/Text";
import Title from "./components/Title";
import { GUTTER } from "./styles";

interface Props {
  currentPatient: number;
  dispatch(action: Action): void;
}

class CameraPermissionRequired extends React.Component<Props> {
  async componentDidMount() {
    await this.requestCameraPermission();
  }

  async requestCameraPermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "EVD Track Camera Permission",
          message:
            "EVD Track needs access to your camera" +
            "to record patient test results.",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        this.props.dispatch(viewDetails(this.props.currentPatient));
      }
    } catch (err) {
      console.warn(err);
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <Title label="Camera Permission Required" />
        <Text content="We're sorry, but access to your device's camera is required. To continue, please update your device settings." />
        <Text content="How to Update:" />
        <Text content="Go to Settings > Apps > EVT Track > Permissions." />
        <Text content="Toggle the Camera switch to on." />
      </View>
    );
  }
}

export default connect((state: StoreState, props: Props) => ({
  currentPatient: state.meta.currentPatient
}))(CameraPermissionRequired);

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    flex: 1,
    margin: GUTTER
  }
});
