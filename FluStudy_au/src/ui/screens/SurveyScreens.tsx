// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { Camera } from "expo";
import Spinner from "react-native-loading-spinner-overlay";
import DeviceInfo from "react-native-device-info";
import { Action, setRDTPhoto, setTestStripImg, uploader } from "../../store";
import { newCSRUID } from "../../util/csruid";
import Chrome from "../components/Chrome";
import Text from "../components/Text";
import {
  RDTReader as RDTReaderComponent,
  ExternalRDTCapturedArgs,
  SizeResult,
  ExposureResult,
} from "../../native/rdtReader";
import { GUTTER, LARGE_TEXT, SYSTEM_PADDING_BOTTOM } from "../styles";
import { savePhoto } from "../../store/FirebaseStore";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

@connect()
class RDTReaderScreen extends React.Component<Props & WithNamespaces> {
  camera = React.createRef<any>();

  constructor(props: Props & WithNamespaces) {
    super(props);
  }

  state = {
    spinner: !DeviceInfo.isEmulator(),
    enabled: true,
  };

  _cameraReady = () => {
    this.setState({ spinner: false });
  };

  _onRDTCaptured = async (args: ExternalRDTCapturedArgs) => {
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
        const photoId = await newCSRUID();

        // PLAT-51: This won't work offline.  But we may not need it to.  More
        // details in the task.
        savePhoto(photoId, args.imgBase64);

        this.props.dispatch(
          setTestStripImg({
            sample_type: "TestStripBase64",
            code: photoId,
          })
        );
        this.setState({ spinner: false, enabled: false });
        this.props.navigation.push("TestStripConfirmation", {
          photo: args.imgBase64,
        });
      } catch (e) {
        this.setState({ spinner: false });
      }
    }
  };

  render() {
    const { t } = this.props;
    return (
      <Chrome navigation={this.props.navigation}>
        <View style={{ flex: 1, marginBottom: -1 * SYSTEM_PADDING_BOTTOM }}>
          <Spinner visible={this.state.spinner} />
          <RDTReaderComponent
            ref={this.camera}
            style={cameraStyles.camera}
            onRDTCaptured={this._onRDTCaptured}
            onRDTCameraReady={this._cameraReady}
            enabled={this.state.enabled}
          />
          <View style={cameraStyles.overlayContainer}>
            <Text
              center={true}
              content={t("title")}
              style={cameraStyles.overlayText}
            />
            <View style={cameraStyles.innerContainer}>
              <Image
                style={rdtStyles.testStrip}
                source={{ uri: "TestStrip2" }}
              />
            </View>
          </View>
        </View>
      </Chrome>
    );
  }
}
export const RDTReader = withNamespaces("RDTReader")(RDTReaderScreen);

const rdtStyles = StyleSheet.create({
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

const cameraStyles = StyleSheet.create({
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
