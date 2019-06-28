// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  AppState,
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { connect } from "react-redux";
import { withNavigationFocus, NavigationScreenProp } from "react-navigation";
import Spinner from "react-native-loading-spinner-overlay";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  Action,
  setTestStripImg,
  setRDTStartTime,
  setRDTCaptureTime,
  setRDTReaderResult,
  setRDTPhoto,
  setRDTPhotoHC,
  setShownRDTFailWarning,
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
import { GUTTER, REGULAR_TEXT, SYSTEM_PADDING_BOTTOM } from "../../styles";
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

interface FeedbackCheck {
  predicate: (result: RDTCapturedArgs) => boolean;
  duration: number;
  action: () => void;
  cooldown: number;
}

interface FeedbackCheckState {
  active: boolean;
  started?: number;
  lastRan?: number;
}

class RDTReader extends React.Component<Props & WithNamespaces> {
  state = {
    spinner: true,
    angle: 0,
    isCentered: false,
    isRightOrientation: false,
    isFocused: false,
    sizeResult: RDTReaderSizeResult.INVALID,
    exposureResult: RDTReaderExposureResult.UNDER_EXPOSED,
    flashEnabled: true,
    fps: 0,
  };

  _didFocus: any;
  _willBlur: any;
  _timer: NodeJS.Timeout | null | undefined;
  _callbackTimestamps: number[] = [];
  _fpsCounterInterval?: NodeJS.Timeout;

  _feedbackChecks: { [key: string]: FeedbackCheck } = {
    exposureFlash: {
      predicate: (readerResult: RDTCapturedArgs) =>
        readerResult.exposureResult === RDTReaderExposureResult.OVER_EXPOSED,
      duration: 5000,
      action: () => this.setState({ flashEnabled: false }),
      cooldown: Infinity,
    },
  };
  _feedbackCheckState: {
    [key: string]: FeedbackCheckState;
  } = {};

  componentDidMount() {
    const { isDemo, navigation } = this.props;
    this._didFocus = navigation.addListener("didFocus", () => {
      this._setTimer();
      if (isDemo) {
        this._fpsCounterInterval = setInterval(this._updateFPSCounter, 1000);
      }
    });
    this._willBlur = navigation.addListener("willBlur", () =>
      this._clearTimer()
    );
    AppState.addEventListener("memoryWarning", this._handleMemoryWarning);
  }

  componentWillUnmount() {
    this._didFocus.remove();
    this._willBlur.remove();
    if (this._fpsCounterInterval) {
      clearInterval(this._fpsCounterInterval);
    }
    AppState.removeEventListener("memoryWarning", this._handleMemoryWarning);
  }

  _setTimer = () => {
    // Timeout after 30 seconds
    this._clearTimer();
    this._timer = setTimeout(() => {
      const { dispatch, fallback, isFocused, navigation } = this.props;
      if (isFocused) {
        tracker.logEvent(AppEvents.RDT_TIMEOUT);
        dispatch(setRDTCaptureTime(false));
        dispatch(setShownRDTFailWarning(false));
        navigation.push(fallback);
        dispatch(setRDTPhoto(""));
        dispatch(setRDTPhotoHC(""));
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
    const { dispatch } = this.props;
    dispatch(setRDTStartTime());
  };

  _onRDTCaptured = async (args: RDTCapturedArgs) => {
    this._updateFeedback(args);
    if (this.props.isDemo) {
      this._callbackTimestamps.push(Date.now());
    }

    if (!args.testStripFound || !args.fiducialFound) {
      return;
    }

    const { dispatch, navigation, next } = this.props;
    dispatch(setRDTCaptureTime(true));
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
        setRDTPhotoHC(`data:image/png;base64,${args.resultWindowImgBase64}`)
      );
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

    for (let key in this._feedbackChecks) {
      const check = this._feedbackChecks[key];
      const state = this._feedbackCheckState[key] || { active: false };
      if (!check.predicate(args)) {
        this._feedbackCheckState[key] = {
          ...state,
          active: false,
          started: undefined,
        };
        continue;
      }
      const now = Date.now();
      if (!state.active || state.started === undefined) {
        this._feedbackCheckState[key] = {
          ...state,
          active: true,
          started: now,
        };
        continue;
      }
      if (
        now - state.started > check.duration &&
        (state.lastRan === undefined || now - state.lastRan > check.cooldown)
      ) {
        this._feedbackCheckState[key] = {
          ...state,
          active: false,
          lastRan: now,
        };
        check.action();
      }
    }
  };

  _updateFPSCounter = () => {
    const now = Date.now();
    if (this._callbackTimestamps.length < 2) {
      this.setState({ fps: 0 });
    } else {
      const first = this._callbackTimestamps[0];
      const last = this._callbackTimestamps[
        this._callbackTimestamps.length - 1
      ];
      this.setState({
        fps: ((this._callbackTimestamps.length - 1) / (last - first)) * 1000,
      });
      this._callbackTimestamps = this._callbackTimestamps.slice(
        this._callbackTimestamps.length - 2
      );
    }
  };

  _toggleFlash = () => {
    this.setState({ flashEnabled: !this.state.flashEnabled });
    tracker.logEvent(AppEvents.FLASH_TOGGLE, {
      flash_on: this.state.flashEnabled,
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
    const { isDemo, isFocused, t } = this.props;
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
          flashEnabled={this.state.flashEnabled}
        />
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
                <View style={styles.feedbackContainer}>
                  <View style={styles.feedbackItem}>
                    <Image
                      style={styles.feedbackItemIcon}
                      source={{
                        uri: this.state.isCentered
                          ? "positiongreen"
                          : "positionyellow",
                      }}
                    />
                    <Text content={t("position")} style={styles.overlayText} />
                  </View>
                  <View style={styles.feedbackItem}>
                    <Image
                      style={styles.feedbackItemIcon}
                      source={{
                        uri:
                          this.state.sizeResult === RDTReaderSizeResult.INVALID
                            ? "distancewhite"
                            : this.state.sizeResult ===
                              RDTReaderSizeResult.RIGHT_SIZE
                              ? "distancegreen"
                              : "distanceyellow",
                      }}
                    />
                    <Text content={t("distance")} style={styles.overlayText} />
                  </View>
                  <View style={styles.feedbackItem}>
                    <Image
                      style={styles.feedbackItemIcon}
                      source={{
                        uri: this.state.isRightOrientation
                          ? "rotationgreen"
                          : "rotationyellow",
                      }}
                    />
                    <Text content={t("rotation")} style={styles.overlayText} />
                  </View>
                </View>
              </View>
              <View style={styles.testStripContainer}>
                <Image
                  style={styles.testStrip}
                  source={{ uri: "teststrip2" }}
                  resizeMode={"center"}
                />
              </View>
              <View style={styles.backgroundOverlay}>
                <View style={styles.feedbackContainer}>
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
                  <View style={styles.feedbackItem} />
                  <View style={styles.feedbackItem} />
                </View>
              </View>
            </View>
            <View style={styles.backgroundOverlay} />
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
        {isDemo ? (
          <View style={styles.fpsCounter}>
            <Text content={`FPS: ${this.state.fps.toFixed(2)}`} />
          </View>
        ) : null}
      </View>
    );
  }
}
export default connect((state: StoreState) => ({
  isDemo: state.meta.isDemo,
}))(withNavigationFocus(withNamespaces("RDTReader")(RDTReader)));

const styles = StyleSheet.create({
  camera: {
    alignSelf: "stretch",
    flex: 1,
  },
  container: {
    backgroundColor: "black",
    flex: 1,
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
    flexDirection: "row",
  },
  overlayText: {
    color: "white",
    fontSize: REGULAR_TEXT,
    marginVertical: GUTTER,
    marginBottom: 0,
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
    aspectRatio: 0.06,
    flex: 1,
    opacity: 0.5,
  },
  testStripContainer: {
    margin: "8%",
  },
  touchableLeft: {
    left: 0,
    top: Dimensions.get("window").height / 2,
    height: Dimensions.get("window").height / 2,
    width: Dimensions.get("window").width / 3,
    position: "absolute",
  },
  touchableRight: {
    left: (Dimensions.get("window").width * 2) / 3,
    top: Dimensions.get("window").height / 2,
    height: Dimensions.get("window").height / 2,
    width: Dimensions.get("window").width / 3,
    position: "absolute",
  },
  fpsCounter: {},
});
