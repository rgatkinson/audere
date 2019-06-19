// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { AppState, Dimensions, Image, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { connect } from "react-redux";
import { withNavigationFocus, NavigationScreenProp } from "react-navigation";
import Spinner from "react-native-loading-spinner-overlay";
import {
  Action,
  setTestStripImg,
  setRDTReaderResult,
  setRDTPhoto,
  StoreState,
} from "../../../store";
import { newUID } from "../../../util/csruid";
import MultiTapContainer from "../MultiTapContainer";
import Text from "../Text";
import {
  RDTReader as RDTReaderComponent,
  RDTCapturedArgs,
} from "../../../native/rdtReader";
import {
  RDTReaderSizeResult,
  RDTReaderExposureResult,
} from "audere-lib/coughProtocol";
import { GUTTER, LARGE_TEXT, SYSTEM_PADDING_BOTTOM } from "../../styles";
import { savePhoto } from "../../../store";
import { tracker, AppEvents } from "../../../util/tracker";

interface Props {
  isDemo: boolean;
  fallback: string;
  next: string;
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
  isFocused: boolean;
}

class RDTReader extends React.Component<Props> {
  state = {
    spinner: true,
    angle: 0,
    isCentered: false,
    isRightOrientation: false,
    isFocused: false,
    sizeResult: RDTReaderSizeResult.INVALID,
    exposureResult: RDTReaderExposureResult.UNDER_EXPOSED,
  };

  _didFocus: any;
  _willBlur: any;
  _timer: NodeJS.Timeout | null | undefined;

  componentDidMount() {
    const { navigation } = this.props;
    this._didFocus = navigation.addListener("didFocus", () =>
      this._setTimer()
    );
    this._willBlur = navigation.addListener("willBlur", () =>
      this._clearTimer()
    );
    AppState.addEventListener("memoryWarning", this._handleMemoryWarning);
  }

  componentWillUnmount() {
    this._didFocus.remove();
    this._willBlur.remove();
    AppState.removeEventListener("memoryWarning", this._handleMemoryWarning);
  }

  _setTimer = () => {
    // Timeout after 30 seconds
    this._clearTimer();
    this._timer = setTimeout(() => {
      const { dispatch, fallback, isFocused, navigation } = this.props;
      if (isFocused) {
        tracker.logEvent(AppEvents.RDT_TIMEOUT);
        navigation.push(fallback);
        dispatch(setRDTReaderResult({ testStripFound: false }));
      }
    }, 30000);
  };

  _clearTimer() {
    if (this._timer != null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  _handleMemoryWarning = () => {
    const { dispatch, fallback, isFocused, navigation } = this.props;
    if (isFocused) {
      navigation.push(fallback);
      dispatch(
        setRDTReaderResult({
          testStripFound: false,
          skippedDueToMemWarning: true,
        })
      );
    }
  };

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

    if (!args.testStripFound || !args.fiducialFound) {
      return;
    }

    const { dispatch, navigation, next } = this.props;
    try {
      const photoId = await newUID();
      dispatch(setRDTPhoto(`data:image/png;base64,${args.imgBase64}`));
      dispatch(
        setTestStripImg({
          sample_type: "RDTReaderPhotoGUID",
          code: photoId,
        })
      );
      savePhoto(photoId, args.imgBase64);
      dispatch(
        setRDTReaderResult({
          testStripFound: args.testStripFound,
          isCentered: args.isCentered,
          sizeResult: args.sizeResult,
          isFocused: args.isFocused,
          angle: args.angle,
          isRightOrientation: args.isRightOrientation,
          exposureResult: args.exposureResult,
          controlLineFound: args.controlLineFound,
          testALineFound: args.testALineFound,
          testBLineFound: args.testBLineFound,
        })
      );
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

  // Simulate negative RDT result
  _forceNegativeResult = () => {
    const { dispatch, navigation, next } = this.props;
    dispatch(
      setRDTReaderResult({
        testStripFound: true,
        controlLineFound: true,
        testALineFound: false,
        testBLineFound: false,
      })
    );
    navigation.push(next);
  };

  // Simulate positive RDT result of Flu-A
  _forcePositiveResult = () => {
    const { dispatch, navigation, next } = this.props;
    dispatch(
      setRDTReaderResult({
        testStripFound: true,
        controlLineFound: true,
        testALineFound: true,
        testBLineFound: false,
      })
    );
    navigation.push(next);
  };

  render() {
    const { isDemo, isFocused } = this.props;
    if (!isFocused) {
      return null;
    }
    return (
      <View style={styles.container}>
        <Spinner visible={this.state.spinner && isFocused} />
        <RDTReaderComponent
          style={styles.camera}
          onRDTCaptured={this._onRDTCaptured}
          onRDTCameraReady={this._cameraReady}
          enabled={isFocused}
          showDefaultViewfinder={false}
          flashEnabled={true}
        />
        <View style={styles.overlayContainer}>
          <View style={styles.testStripContainer}>
            <Image style={styles.testStrip} source={{ uri: "teststrip2" }} />
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
                  this.state.sizeResult === RDTReaderSizeResult.RIGHT_SIZE
                    ? "green"
                    : "gray"
                }
                size={50}
              />
              <Text
                content={
                  this.state.sizeResult === RDTReaderSizeResult.RIGHT_SIZE
                    ? ""
                    : this.state.sizeResult === RDTReaderSizeResult.LARGE
                      ? "large"
                      : this.state.sizeResult === RDTReaderSizeResult.SMALL
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
                  this.state.exposureResult === RDTReaderExposureResult.NORMAL
                    ? "green"
                    : "gray"
                }
                size={50}
              />
              <Text
                content={
                  this.state.exposureResult === RDTReaderExposureResult.NORMAL
                    ? ""
                    : this.state.exposureResult ===
                      RDTReaderExposureResult.OVER_EXPOSED
                      ? "over"
                      : "under"
                }
                style={{ color: "red" }}
              />
            </View>
          </View>
        </View>
        <MultiTapContainer
          active={isDemo}
          style={styles.touchableLeft}
          taps={3}
          onMultiTap={this._forceNegativeResult}
        />
        <MultiTapContainer
          active={isDemo}
          style={styles.touchableRight}
          taps={3}
          onMultiTap={this._forcePositiveResult}
        />
      </View>
    );
  }
}
export default connect((state: StoreState) => ({
  isDemo: state.meta.isDemo,
}))(withNavigationFocus(RDTReader));

const styles = StyleSheet.create({
  camera: {
    alignSelf: "stretch",
    flex: 1,
  },
  container: {
    backgroundColor: "black",
    flex: 1,
    marginBottom: -1 * SYSTEM_PADDING_BOTTOM,
    marginHorizontal: -GUTTER,
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
    height: Dimensions.get("window").height * 0.8,
    opacity: 0.5,
  },
  testStripContainer: {
    borderColor: "rgba(0, 0, 0, 0.7)",
    borderWidth: Dimensions.get("window").width / 2 - GUTTER * 2,
    padding: GUTTER * 2,
  },
  touchableLeft: {
    left: 0,
    top: 0,
    height: Dimensions.get("window").height / 2,
    width: Dimensions.get("window").width / 3,
    position: "absolute",
  },
  touchableRight: {
    left: (Dimensions.get("window").width * 2) / 3,
    top: 0,
    height: Dimensions.get("window").height / 2,
    width: Dimensions.get("window").width / 3,
    position: "absolute",
  },
});
