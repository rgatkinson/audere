// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import Spinner from "react-native-loading-spinner-overlay";
import DeviceInfo from "react-native-device-info";
import { Action, setTestStripImg, setRDTPhoto, uploader } from "../../../store";
import { newUID } from "../../../util/csruid";
import Text from "../Text";
import {
  RDTReader as RDTReaderComponent,
  RDTCapturedArgs,
  SizeResult,
  ExposureResult,
} from "../../../native/rdtReader";
import { GUTTER, LARGE_TEXT, SYSTEM_PADDING_BOTTOM } from "../../styles";
import { savePhoto } from "../../../store/FirebaseStore";

interface Props {
  next: string;
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

@connect()
class RDTReader extends React.Component<Props & WithNamespaces> {
  camera = React.createRef<any>();

  state = {
    spinner: !DeviceInfo.isEmulator(),
    enabled: true,
  };

  _cameraReady = () => {
    this.setState({ spinner: false });
  };

  _onRDTCaptured = async (args: RDTCapturedArgs) => {
    const { dispatch, navigation, next } = this.props;
    const logArgs = { ...args };
    logArgs.imgBase64 = logArgs.imgBase64.substring(0, 100) + "...";
    if (!args.testStripFound) {
      return;
    }
    console.log(JSON.stringify(logArgs, null, 2));
    console.log("SizeResult: " + SizeResult[logArgs.sizeResult]);
    console.log("ExposureResult: " + ExposureResult[logArgs.exposureResult]);
    if (!this.state.spinner) {
      this.setState({ spinner: true });

      try {
        const photoId = await newUID();

        // PLAT-51: This won't work offline.  But we may not need it to.  More
        // details in the task.
        savePhoto(photoId, args.imgBase64);

        dispatch(
          setTestStripImg({
            sample_type: "TestStripBase64",
            code: photoId,
          })
        );
        dispatch(setRDTPhoto(args.imgBase64));

        this.setState({ spinner: false, enabled: false });
        navigation.push(next);
      } catch (e) {
        this.setState({ spinner: false });
      }
    }
  };

  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        <Spinner visible={this.state.spinner} />
        <RDTReaderComponent
          ref={this.camera}
          style={styles.camera}
          onRDTCaptured={this._onRDTCaptured}
          onRDTCameraReady={this._cameraReady}
          enabled={this.state.enabled}
        />
        <View style={styles.overlayContainer}>
          <Text center={true} content={t("title")} style={styles.overlayText} />
          <View style={styles.innerContainer}>
            <Image style={styles.testStrip} source={{ uri: "TestStrip2" }} />
          </View>
        </View>
      </View>
    );
  }
}
export default withNavigation(withNamespaces("RDTReader")(RDTReader));

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    flex: 1,
    marginBottom: -1 * SYSTEM_PADDING_BOTTOM,
    marginHorizontal: Platform.OS === "ios" ? -GUTTER : 0,
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
  testStrip: {
    alignSelf: "center",
    aspectRatio: 0.06,
    height: "65%",
    opacity: 0.5,
    marginTop: GUTTER,
    marginLeft: GUTTER,
    width: undefined,
  },
});
