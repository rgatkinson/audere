// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Feather } from "@expo/vector-icons";
import { Camera } from "expo-camera";
import React from "react";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  Alert,
  AppState,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import DeviceInfo from "react-native-device-info";
import Spinner from "react-native-loading-spinner-overlay";
import {
  NavigationScreenProp,
  StackActions,
  withNavigation,
} from "react-navigation";
import { connect } from "react-redux";
import {
  Action,
  setPhoto,
  setShownRDTFailWarning,
  setTestStripImg,
  StoreState,
  uploadFile,
} from "../../../store";
import { newUID } from "../../../util/csruid";
import { canUseRdtReader } from "../../../util/fluResults";
import { AppHealthEvents, logFirebaseEvent } from "../../../util/tracker";
import { GUTTER, REGULAR_TEXT, SCREEN_MARGIN } from "../../styles";
import Text from "../Text";

interface Props {
  next: string;
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
  shownRDTFailWarning: boolean;
}

const RDT_ASPECT_RATIO = 5.0 / 87;
const INSTRUCTION_HEIGHT_PCT = 0.15;
const RDT_HEIGHT_PCT = 0.65;
const BOTTOM_HEIGHT_PCT = 1 - INSTRUCTION_HEIGHT_PCT - RDT_HEIGHT_PCT;

class TestStripCamera extends React.Component<Props & WithNamespaces> {
  camera = React.createRef<any>();

  MAX_CAMERA_RETRIES = 3;

  state = {
    spinner: !DeviceInfo.isEmulator() && !this._shouldShowAlert(),
    flashEnabled: false,
    showCamera: !this._shouldShowAlert(),
    supportsTorchMode: this.props.navigation.getParam("supportsTorchMode"),
  };

  _didFocus: any;

  componentDidMount() {
    this._didFocus = this.props.navigation.addListener(
      "didFocus",
      this._handleDidFocus
    );
    AppState.addEventListener("change", this._handleAppStateChange);

    this._handleDidFocus();
  }

  componentWillUnmount() {
    this._didFocus.remove();
    AppState.removeEventListener("change", this._handleAppStateChange);
  }

  _shouldShowAlert() {
    return !this.props.shownRDTFailWarning && canUseRdtReader();
  }

  _handleDidFocus = () => {
    if (this._shouldShowAlert()) {
      const { dispatch, t } = this.props;
      dispatch(setShownRDTFailWarning(true));
      Alert.alert(
        t("alertTitle"),
        t("alertDesc"),
        [
          {
            text: t("common:button:ok"),
            onPress: () => {
              this.setState({
                spinner: !DeviceInfo.isEmulator(),
                showCamera: true,
              });
            },
          },
        ],
        { cancelable: false }
      );
    }
  };

  _handleAppStateChange = async (nextAppState: string) => {
    if (
      nextAppState === "active" &&
      this.state.supportsTorchMode &&
      this.state.flashEnabled
    ) {
      // Toggle flash state since the hardware state doesn't seem to get preserved
      // on iOS if the app is backgrounded and then foregrounded.
      this.setState({ flashEnabled: false });
      this.setState({ flashEnabled: true });
    }
  };

  _cameraReady = () => {
    this.setState({ spinner: false });
  };

  _cameraError = () => {
    if (!DeviceInfo.isEmulator()) {
      const { navigation, t } = this.props;
      const retries = navigation.getParam("cameraRetries", 0);
      if (retries < this.MAX_CAMERA_RETRIES) {
        navigation.dispatch(
          StackActions.replace({
            routeName: "TestStripCamera",
            params: { cameraRetries: retries + 1 },
          })
        );
      } else {
        Alert.alert(
          t("cameraErrorTitle"),
          t("cameraErrorDesc"),
          [
            {
              text: t("common:button:ok"),
              onPress: () => {
                logFirebaseEvent(AppHealthEvents.CAMERA_ERROR);
                navigation.dispatch(
                  StackActions.replace({ routeName: "PackUpTest" })
                );
              },
            },
          ],
          { cancelable: false }
        );
      }
    }
  };

  _toggleFlash = () => {
    this.setState({ flashEnabled: !this.state.flashEnabled });
  };

  _takePicture = async () => {
    const { dispatch, navigation, next, t } = this.props;
    if (!this.state.spinner) {
      this.setState({ spinner: true });

      try {
        const photo = await this.camera.current!.takePictureAsync({
          quality: 0.8,
          base64: true,
          orientation: "portrait",
          fixOrientation: true,
        });
        const photoId = (await newUID()) + ".jpeg";

        uploadFile(photoId, photo.uri);

        dispatch(
          setTestStripImg({
            sample_type: "PhotoGUID",
            code: photoId,
          })
        );
        dispatch(setPhoto(photo.uri));

        this.setState({ spinner: false });
        navigation.dispatch(StackActions.push({ routeName: next }));
      } catch (e) {
        Alert.alert("", t("error") + "\n\n" + e, [
          {
            text: t("common:button:ok"),
            onPress: () => {
              this.setState({ spinner: false });
            },
          },
        ]);
      }
    }
  };

  _getFlashToggle = () => {
    if (this.state.supportsTorchMode) {
      const { t } = this.props;
      return (
        <View style={styles.overlayContainer}>
          <View style={{ flex: 3 }} />
          <View style={{ flex: 1 }} />
          <View style={{ flex: 3 }}>
            <TouchableOpacity onPress={this._toggleFlash}>
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <Image
                  style={styles.feedbackItemIcon}
                  source={{
                    uri: this.state.flashEnabled ? "flashon" : "flashoff",
                  }}
                />
                <Text
                  content={
                    t("flash") + (this.state.flashEnabled ? t("on") : t("off"))
                  }
                  style={styles.feedbackItemText}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return null;
  };

  _onBack = () => {
    this.props.navigation.dispatch(StackActions.pop({ n: 1 }));
  };

  render() {
    if (!this.props.navigation.isFocused()) {
      return null;
    }

    const { t } = this.props;

    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />
        <Spinner visible={this.state.spinner} />
        {this.state.showCamera && (
          <Camera
            ref={this.camera}
            style={styles.camera}
            onCameraReady={this._cameraReady}
            onMountError={this._cameraError}
            flashMode={
              this.state.flashEnabled
                ? Camera.Constants.FlashMode.torch
                : Camera.Constants.FlashMode.off
            }
          />
        )}
        <View style={styles.overlayContainer}>
          <View style={{ flex: 1 }}>
            <View
              style={[
                styles.backgroundOverlay,
                { flex: INSTRUCTION_HEIGHT_PCT },
              ]}
            >
              <View style={styles.backButton}>
                <TouchableOpacity onPress={this._onBack}>
                  <Feather color="white" name="arrow-left" size={30} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flex: RDT_HEIGHT_PCT, flexDirection: "row" }}>
              <View style={[styles.backgroundOverlay, { flex: 1 }]} />
              <View style={styles.testStripContainer}>
                <View style={styles.testStripViewfinder} />
              </View>
              <View style={[styles.backgroundOverlay, { flex: 1 }]} />
            </View>
            <View
              style={[
                styles.backgroundOverlay,
                { flex: BOTTOM_HEIGHT_PCT, justifyContent: "flex-end" },
              ]}
            >
              <TouchableOpacity
                style={styles.outerCircle}
                onPress={this._takePicture}
                disabled={!this.state.showCamera}
              >
                <View style={styles.circle} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {this._getFlashToggle()}
      </View>
    );
  }
}
export default connect((state: StoreState) => ({
  shownRDTFailWarning: state.meta.shownRDTFailWarning,
}))(withNavigation(withNamespaces("TestStripCamera")(TestStripCamera)));

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    flex: 1,
    marginHorizontal: -SCREEN_MARGIN,
  },
  camera: {
    alignSelf: "stretch",
    flex: 1,
  },
  overlayContainer: {
    alignItems: "center",
    justifyContent: "center",
    left: 0,
    right: 0,
    position: "absolute",
    top: 0,
    bottom: 0,
    flexDirection: "row",
  },
  overlayText: {
    color: "white",
    fontSize: REGULAR_TEXT,
    marginVertical: GUTTER,
    textShadowColor: "rgba(0, 0, 0, 0.99)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  backgroundOverlay: {
    flex: 1,
    backgroundColor: "rgba(51,51,51, 0.6)",
  },
  feedbackItemIcon: {
    height: 32,
    width: 32,
  },
  feedbackItemText: {
    alignItems: "center",
    color: "white",
    fontSize: REGULAR_TEXT,
    justifyContent: "center",
    marginVertical: GUTTER,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.99)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  testStripViewfinder: {
    aspectRatio: RDT_ASPECT_RATIO,
    height: "100%",
  },
  testStripContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },

  outerCircle: {
    alignItems: "center",
    justifyContent: "center",
    borderColor: "white",
    borderWidth: 7,
    borderRadius: 40,
    height: 80,
    width: 80,
    position: "absolute",
    left: (Dimensions.get("window").width - 80) / 2,
    bottom: GUTTER / 2,
  },
  circle: {
    backgroundColor: "white",
    borderRadius: 30,
    borderWidth: 3,
    height: 60,
    width: 60,
  },
  backButton: {
    marginTop: GUTTER,
    marginLeft: GUTTER / 2,
  },
});
