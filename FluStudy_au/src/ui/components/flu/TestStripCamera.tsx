// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  Alert,
  AppState,
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  withNavigation,
  NavigationScreenProp,
  StackActions,
} from "react-navigation";
import { Camera } from "expo-camera";
import Spinner from "react-native-loading-spinner-overlay";
import DeviceInfo from "react-native-device-info";
import {
  Action,
  setTestStripImg,
  setPhoto,
  setRDTCaptureInfo,
  setShownRDTFailWarning,
  StoreState,
} from "../../../store";
import { logFirebaseEvent, AppHealthEvents } from "../../../util/tracker";
import { newUID } from "../../../util/csruid";
import Text from "../Text";
import { GUTTER, REGULAR_TEXT, SCREEN_MARGIN } from "../../styles";
import { savePhoto } from "../../../store";
import { getRemoteConfig } from "../../../util/remoteConfig";

interface Props {
  next: string;
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
  shownRDTFailWarning: boolean;
}

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
    return (
      !this.props.shownRDTFailWarning &&
      getRemoteConfig("rdtTimeoutSeconds") > 0
    );
  }

  _handleDidFocus = () => {
    if (this._shouldShowAlert()) {
      const { dispatch, t } = this.props;
      dispatch(setShownRDTFailWarning(true));
      Alert.alert(t("alertTitle"), t("alertDesc"), [
        {
          text: t("common:button:ok"),
          onPress: () => {
            this.setState({
              spinner: !DeviceInfo.isEmulator(),
              showCamera: true,
            });
          },
        },
      ]);
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
        Alert.alert(t("cameraErrorTitle"), t("cameraErrorDesc"), [
          {
            text: t("common:button:ok"),
            onPress: () => {
              logFirebaseEvent(AppHealthEvents.CAMERA_ERROR);
              navigation.dispatch(
                StackActions.replace({ routeName: "TestResult" })
              );
            },
          },
        ]);
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
        const photoId = await newUID();

        savePhoto(photoId, photo.base64);

        dispatch(
          setTestStripImg({
            sample_type: "PhotoGUID",
            code: photoId,
          })
        );
        dispatch(setPhoto(photo.uri));
        dispatch(
          setRDTCaptureInfo(
            this.state.supportsTorchMode && this.state.flashEnabled,
            false
          )
        );

        this.setState({ spinner: false });
        navigation.push(next);
      } catch (e) {
        Alert.alert("", t("error"), [
          { text: t("common:button:ok"), onPress: () => {} },
        ]);
        this.setState({ spinner: false });
      }
    }
  };

  render() {
    if (!this.props.navigation.isFocused()) {
      return null;
    }

    const { t } = this.props;

    return (
      <View style={styles.container}>
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
          <View style={{ flexDirection: "column", flex: 1 }}>
            <View style={styles.backgroundOverlay} />
            <View
              style={{
                height: "65%",
                flexDirection: "row",
              }}
            >
              <View style={styles.backgroundOverlay}>
                <View style={styles.feedbackContainer} />
              </View>
              <View style={styles.testStripContainer}>
                <Image
                  style={styles.testStrip}
                  source={{ uri: "teststrip2" }}
                  resizeMode={"contain"}
                />
              </View>
              <View style={styles.backgroundOverlay}>
                <View style={styles.feedbackContainer}>
                  {this.state.supportsTorchMode && (
                    <TouchableOpacity
                      style={styles.feedbackItem}
                      onPress={this._toggleFlash}
                    >
                      <Image
                        style={styles.feedbackItemIcon}
                        source={{
                          uri: this.state.flashEnabled ? "flashon" : "flashoff",
                        }}
                      />
                      <Text
                        content={
                          t("flash") +
                          (this.state.flashEnabled ? t("on") : t("off"))
                        }
                        style={styles.overlayText}
                      />
                    </TouchableOpacity>
                  )}
                  <View style={styles.feedbackItem} />
                  <View style={styles.feedbackItem} />
                </View>
              </View>
            </View>
            <View style={styles.backgroundOverlay} />
          </View>
        </View>
        <TouchableOpacity
          style={styles.outerCircle}
          onPress={this._takePicture}
          disabled={!this.state.showCamera}
        >
          <View style={styles.circle} />
        </TouchableOpacity>
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  feedbackContainer: {
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    justifyContent: "space-between",
  },
  feedbackItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  feedbackItemIcon: {
    height: 32,
    width: 32,
  },
  testStrip: {
    aspectRatio: 0.048,
    flex: 1,
    opacity: 0.5,
  },
  testStripContainer: {
    marginHorizontal: "8%",
    marginVertical: "-4%",
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
});
