// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Alert, Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import { Camera } from "expo";
import Spinner from "react-native-loading-spinner-overlay";
import DeviceInfo from "react-native-device-info";
import { Action, setTestStripImg, setRDTPhoto, uploader } from "../../../store";
import { newCSRUID } from "../../../util/csruid";
import Text from "../Text";
import { GUTTER, LARGE_TEXT, SYSTEM_PADDING_BOTTOM } from "../../styles";
import { savePhoto } from "../../../store/FirebaseStore";

interface Props {
  next: string;
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

@connect()
class TestStripCamera extends React.Component<Props & WithNamespaces> {
  camera = React.createRef<any>();

  constructor(props: Props & WithNamespaces) {
    super(props);
    this._takePicture = this._takePicture.bind(this);
  }

  state = {
    spinner: !DeviceInfo.isEmulator(),
  };

  _cameraReady = () => {
    this.setState({ spinner: false });
  };

  async _takePicture() {
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
        const photoId = await newCSRUID();

        // PLAT-51: This won't work offline.  But we may not need it to.  More
        // details in the task.
        savePhoto(photoId, photo.base64);

        dispatch(
          setTestStripImg({
            sample_type: "TestStripBase64",
            code: photoId,
          })
        );
        dispatch(setRDTPhoto(photo.uri));

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
    const { t } = this.props;
    return (
      <View style={styles.container}>
        <Spinner visible={this.state.spinner} />
        <Camera
          ref={this.camera}
          style={styles.camera}
          onCameraReady={this._cameraReady}
        />
        <View style={styles.overlayContainer}>
          <Text
            center={true}
            content={t("title")}
            style={styles.overlayText}
          />
          <View style={styles.innerContainer}>
            <Image
              style={styles.testStrip}
              source={{ uri: "teststripdetail" }}
            />
            <View style={{ flex: 1, marginLeft: GUTTER }}>
              <Text center={true} content={t("stripHere")} style={styles.overlayText} />
              <View style={styles.targetBox} />
            </View>
          </View>
          <View style={{ alignItems: "center", alignSelf: "stretch" }}>
            <Text center={true} content={t("description")} style={styles.overlayText} />
            <TouchableOpacity onPress={this._takePicture}>
              <View style={styles.outerCircle}>
                <View style={styles.circle} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
}
export default withNavigation(withNamespaces("TestStripCamera")(TestStripCamera));

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    flex: 1,
    marginBottom: -1 * SYSTEM_PADDING_BOTTOM,
    marginHorizontal: -GUTTER,
  },
  camera: {
    alignSelf: "stretch",
    flex: 1,
  },
  innerContainer: {
    height: "100%",
    flexDirection: "row",
    flex: 1,
    marginHorizontal: GUTTER * 2,
    marginBottom: GUTTER,
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
    fontSize: LARGE_TEXT,
    marginVertical: GUTTER,
    textShadowColor: "rgba(0, 0, 0, 0.99)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  overlayContainer: {
    alignItems: "center",
    justifyContent: "space-between",
    left: 0,
    right: 0,
    position: "absolute",
    top: 0,
    bottom: 0,
    marginBottom: GUTTER + SYSTEM_PADDING_BOTTOM,
  },
  targetBox: {
    alignSelf: "center",
    borderColor: "white",
    borderRadius: 5,
    borderStyle: "dashed",
    borderWidth: 4,
    flex: 1,
    shadowColor: "rgba(0, 0, 0, 0.99)",
    shadowOffset: { width: -1, height: 1 },
    shadowRadius: 10,
    width: "65%",
  },
  testStrip: {
    alignSelf: "center",
    aspectRatio: 0.135,
    height: "95%",
    marginTop: GUTTER,
    marginLeft: GUTTER,
    width: undefined,
  },
});
