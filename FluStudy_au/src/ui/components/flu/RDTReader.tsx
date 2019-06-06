// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Dimensions, Image, Platform, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { withNavigationFocus, NavigationScreenProp } from "react-navigation";
import Spinner from "react-native-loading-spinner-overlay";
import { Action, setTestStripImg, setRDTPhoto } from "../../../store";
import { newUID } from "../../../util/csruid";
import Text from "../Text";
import {
  RDTReader as RDTReaderComponent,
  RDTCapturedArgs,
  SizeResult,
  ExposureResult,
} from "../../../native/rdtReader";
import { GUTTER, LARGE_TEXT, SYSTEM_PADDING_BOTTOM } from "../../styles";
import { savePhoto } from "../../../store";

interface Props {
  fallback: string;
  next: string;
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
  isFocused: boolean;
}

class RDTReader extends React.Component<Props & WithNamespaces> {
  state = {
    spinner: true,
    color: "yellow",
    isCentered: false,
    isRightOrientation: false,
    isFocused: false,
    sizeResult: SizeResult.INVALID,
    exposureResult: ExposureResult.UNDER_EXPOSED,
  };

  _willFocus: any;
  _willBlur: any;
  _timer: NodeJS.Timeout | null | undefined;

  constructor(props: Props & WithNamespaces) {
    super(props);
    this._setTimer = this._setTimer.bind(this);
  }

  componentDidMount() {
    const { navigation } = this.props;
    this._willFocus = navigation.addListener("willFocus", () =>
      this._setTimer()
    );
    this._willBlur = navigation.addListener("willBlur", () =>
      this._clearTimer()
    );
  }

  componentWillUnmount() {
    this._willFocus.remove();
    this._willBlur.remove();
  }

  _setTimer() {
    const { fallback, isFocused, navigation } = this.props;
    // Timeout after 30 seconds
    this._clearTimer();
    this._timer = setTimeout(() => {
      if (isFocused) {
        navigation.push(fallback);
      }
    }, 30000);
  }

  _clearTimer() {
    if (this._timer != null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    if (!this.props.isFocused && nextProps.isFocused) {
      this.setState({ spinner: true });
    }
  }

  _cameraReady = () => {
    this.setState({ spinner: false });
  };

  _onRDTCaptured = async (args: RDTCapturedArgs) => {
    if (!args.testStripFound) {
      this._updateFeedback(args);
      return;
    }

    const { dispatch, navigation, next } = this.props;
    try {
      const photoId = await newUID();
      dispatch(setRDTPhoto(args.imgBase64));
      dispatch(
        setTestStripImg({
          sample_type: "RDTReaderPhotoGUID",
          code: photoId,
        })
      );
      savePhoto(photoId, args.imgBase64);
      navigation.push(next);
    } catch (e) {
      console.log(e);
    }
  };

  _updateFeedback = (args: RDTCapturedArgs) => {
    const {
      isCentered,
      sizeResult,
      isFocused,
      isRightOrientation,
      exposureResult,
    } = args;

    const score =
      0 +
      (isCentered ? 1 : 0) +
      (isFocused ? 1 : 0) +
      (isRightOrientation ? 1 : 0) +
      (sizeResult === SizeResult.RIGHT_SIZE ? 1 : 0) +
      (exposureResult === ExposureResult.NORMAL ? 1 : 0);

    let color = this.state.color;
    if (score > 3) {
      color = "green";
    } else if (score > 1) {
      color = "greenyellow";
    } else {
      color = "yellow";
    }

    this.setState({
      color,
      isCentered,
      sizeResult,
      isFocused,
      isRightOrientation,
      exposureResult,
    });
  };

  render() {
    const { t } = this.props;
    if (!this.props.isFocused) {
      return null;
    }
    return (
      <View style={styles.container}>
        <Spinner visible={this.state.spinner && this.props.isFocused} />
        <RDTReaderComponent
          style={styles.camera}
          onRDTCaptured={this._onRDTCaptured}
          onRDTCameraReady={this._cameraReady}
          enabled={this.props.isFocused}
        />
        <View style={[styles.overlayContainer, { alignItems: "flex-start" }]}>
          <View style={{ flexDirection: 'row' }}>
            <Text content="Centered:" />
            {this.state.isCentered ?
              <Feather name="check" color="green" size={20} /> :
              <Feather name="x" color="red" size={20} />}
          </View>
          <View style={{ flexDirection: 'row' }}>
          <Text content="Focused:" />
          {this.state.isFocused ?
            <Feather name="check" color="green" size={20} /> :
            <Feather name="x" color="red" size={20} />}
          </View>
          <View style={{ flexDirection: 'row' }}>
          <Text content="Orientation:" />
          {this.state.isRightOrientation ?
            <Feather name="check" color="green" size={20} /> :
            <Feather name="x" color="red" size={20} />}
          </View>
          <View style={{ flexDirection: 'row' }}>
          <Text content="Size:" />
          {this.state.sizeResult === SizeResult.RIGHT_SIZE ?
            <Feather name="check" color="green" size={20} /> :
            (this.state.sizeResult === SizeResult.LARGE ?
              <Text content=" LARGE" style={{ color: "red" }} /> :
              <Text content=" SMALL" style={{ color: "red" }} />
            )}
          </View>
          <View style={{ flexDirection: 'row' }}>
          <Text content="Exposure:" />
          {this.state.exposureResult === ExposureResult.NORMAL ?
            <Feather name="check" color="green" size={20} /> :
            <Feather name="x" color="red" size={20} />}
          </View>
        </View>
        <View style={styles.overlayContainer}>
          <Image style={styles.testStrip} source={{ uri: "TestStrip2" }} />
        </View>
        <View style={styles.overlayContainer}>
          <View style={styles.shapeContainer}>
            <View style={styles.row}>
              <Image
                style={styles.shape}
                source={{ uri: this.state.color + "square" }}
              />
              <Image
                style={styles.shape}
                source={{ uri: this.state.color + "circle" }}
              />
            </View>
            <View style={styles.row}>
              <Image
                style={styles.shape}
                source={{ uri: this.state.color + "triangle" }}
              />
              <Image
                style={styles.shape}
                source={{ uri: this.state.color + "hexagon" }}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }
}
export default connect()(withNavigationFocus(withNamespaces("RDTReader")(RDTReader)));

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
    height: Dimensions.get("window").height / 2 - GUTTER,
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
