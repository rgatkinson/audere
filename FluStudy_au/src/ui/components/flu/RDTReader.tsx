// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Dimensions, Image, Platform, StyleSheet, View } from "react-native";
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
  state = {
    spinner: !DeviceInfo.isEmulator(),
    enabled: true,
    color: "yellow",
  };

  _cameraReady = () => {
    this.setState({ spinner: false });
  };

  _onRDTCaptured = async (args: RDTCapturedArgs) => {
    if (!args.testStripFound) {
      this._updateFeedback(args);
      return;
    }

    const { dispatch, navigation, next } = this.props;
    if (!this.state.spinner) {
      this.setState({ spinner: true });
      try {
        const photoId = await newUID();
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

  _updateFeedback = (args: RDTCapturedArgs) => {
    const { isCentered, sizeResult, isFocused, isRightOrientation, exposureResult } = args;
    const score = 0
      + (isCentered ? 1 : 0)
      + (isFocused ? 1 : 0)
      + (isRightOrientation ? 1 : 0)
      + (sizeResult === SizeResult.RIGHT_SIZE ? 1 : 0)
      + (exposureResult === ExposureResult.NORMAL ? 1 : 0);

    if (score > 3) {
      this.setState({ color: "green" });
    } else if (score > 1) {
      this.setState({ color: "greenyellow" });
    } else {
      this.setState({ color: "yellow" });
    }
  }

  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        <Spinner visible={this.state.spinner} />
        <RDTReaderComponent
          style={styles.camera}
          onRDTCaptured={this._onRDTCaptured}
          onRDTCameraReady={this._cameraReady}
          enabled={this.state.enabled}
        />
        <View style={styles.overlayContainer}>
          <Image style={styles.testStrip} source={{ uri: "TestStrip2" }} />
        </View>
        <View style={styles.overlayContainer}>
          <View style={styles.shapeContainer}>
            <View style={styles.row}>
              <Image style={styles.shape} source={{ uri: this.state.color + "square" }} />
              <Image style={styles.shape} source={{ uri: this.state.color + "circle" }} />
            </View>
            <View style={styles.row}>
              <Image style={styles.shape} source={{ uri: this.state.color + "triangle" }} />
              <Image style={styles.shape} source={{ uri: this.state.color + "hexagon" }} />
            </View>
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
    justifyContent: "center",
    left: 0,
    right: 0,
    position: "absolute",
    top: 0,
    bottom: 0,
    marginBottom: SYSTEM_PADDING_BOTTOM,
  },
  testStrip: {
    aspectRatio: 0.06,
    height: (Dimensions.get("window").height / 2) - GUTTER,
    opacity: 0.5,
    width: undefined,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 80,
  },
  shapeContainer: {
    height: Dimensions.get("window").height / 2,
    justifyContent: "space-between",
  },
  shape: {
    width: 24,
    height: 24,
  },
});
