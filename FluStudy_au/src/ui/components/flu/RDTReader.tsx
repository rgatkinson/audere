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
    angle: 0,
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
    this._updateFeedback(args);

    if (!args.testStripFound) {
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
      angle,
      isCentered,
      sizeResult,
      isFocused,
      isRightOrientation,
      exposureResult,
    } = args;

    this.setState({
      angle,
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
          flashEnabled={true}
        />
        <View style={styles.overlayContainer}>
          <View style={styles.testStripContainer}>
            <Image style={styles.testStrip} source={{ uri: "TestStrip2" }} />
          </View>
        </View>
        <View style={styles.overlayContainer}>
          <View style={styles.feedbackContainer}>
            <View style={styles.feedbackItem}>
              <Text content="Centered" style={styles.overlayText} />
              <Feather
                name="check"
                color={this.state.isCentered ? "green" : "gray"}
                size={50}
              />
            </View>
            <View style={styles.feedbackItem}>
              <Text content="Angle" style={styles.overlayText} />
              <Feather
                name="check"
                color={this.state.isRightOrientation ? "green" : "gray"}
                size={50}
              />
              <Text
                content={
                  this.state.isRightOrientation
                    ? ""
                    : ("" + this.state.angle).substring(0, 5)
                }
                style={{ color: "red" }}
              />
            </View>
            <View style={styles.feedbackItem}>
              <Text content="Size" style={styles.overlayText} />
              <Feather
                name="check"
                color={
                  this.state.sizeResult === SizeResult.RIGHT_SIZE
                    ? "green"
                    : "gray"
                }
                size={50}
              />
              <Text
                content={
                  this.state.sizeResult === SizeResult.RIGHT_SIZE
                    ? ""
                    : this.state.sizeResult === SizeResult.LARGE
                      ? "large"
                      : this.state.sizeResult === SizeResult.SMALL
                        ? "small"
                        : "invalid"
                }
                style={{ color: "red" }}
              />
            </View>
            <View style={styles.feedbackItem}>
              <Text content="Lighting" style={styles.overlayText} />
              <Feather
                name="check"
                color={
                  this.state.exposureResult === ExposureResult.NORMAL
                    ? "green"
                    : "gray"
                }
                size={50}
              />
              <Text
                content={
                  this.state.exposureResult === ExposureResult.NORMAL
                    ? ""
                    : this.state.exposureResult === ExposureResult.OVER_EXPOSED
                      ? "over"
                      : "under"
                }
                style={{ color: "red" }}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }
}
export default connect()(
  withNavigationFocus(withNamespaces("RDTReader")(RDTReader))
);

const styles = StyleSheet.create({
  camera: {
    alignSelf: "stretch",
    flex: 1,
  },
  container: {
    backgroundColor: "black",
    flex: 1,
    marginBottom: -1 * SYSTEM_PADDING_BOTTOM,
    marginHorizontal: Platform.OS === "ios" ? -GUTTER : 0,
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
  overlayText: {
    color: "white",
    fontSize: LARGE_TEXT,
    marginVertical: GUTTER,
    marginBottom: 0,
    textShadowColor: "rgba(0, 0, 0, 0.99)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  feedbackContainer: {
    alignItems: "flex-start",
    alignSelf: "stretch",
    flex: 1,
    justifyContent: "space-between",
    margin: GUTTER * 2,
  },
  feedbackItem: {
    alignItems: "center",
    flex: 1,
    width: Dimensions.get("window").width / 4,
  },
  testStrip: {
    aspectRatio: 0.06,
    height: Dimensions.get("window").height / 2,
    opacity: 0.5,
  },
  testStripContainer: {
    borderColor: "rgba(0, 0, 0, 0.7)",
    borderWidth: 1000,
    padding: GUTTER * 2,
  },
});
