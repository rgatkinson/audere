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
  RDTCameraReadyArgs,
  RDTInterpretingArgs,
} from "../../../native/rdtReader";
import {
  RDTReaderSizeResult,
  RDTReaderExposureResult,
} from "audere-lib/coughProtocol";
import { GUTTER, SCREEN_MARGIN, LARGE_TEXT, REGULAR_TEXT } from "../../styles";
import { savePhoto } from "../../../store";
import { logFirebaseEvent, AppEvents } from "../../../util/tracker";
import { getRemoteConfig } from "../../../util/remoteConfig";

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
  numCorrect?: number; // number of times correct over numSamples
  numSamples?: number; // number of samples to measure correctness
  duration: number;
  action: () => void;
  inaction?: () => void;
  cooldown: number;
}

interface FeedbackCheckState {
  active: boolean;
  started?: number;
  lastRan?: number;
  avgCorrectness?: number;
}

interface FeedbackInstructionRequest {
  issue?: string;
  msg: string;
  primary?: boolean;
  lastRequested: number;
}

const DEBUG_RDT_READER_UX = process.env.DEBUG_RDT_READER_UX === "true";
const ALLOW_ICON_FEEDBACK = false; // Experimental for now; we'll revisit whether we should add icons back in
const PREDICATE_DURATION_SHORT = 500;
const PREDICATE_DURATION_NORMAL = 1000;
const INSTRUCTION_DURATION_NORMAL = 2000;
const INSTRUCTION_DURATION_OKTEXT = 1000;

function debug(s: string) {
  if (DEBUG_RDT_READER_UX) {
    console.log(`RDT: ${s}`);
  }
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
    instructionMsg: "centerStrip",
    instructionIsOK: false,
    appState: "",
    supportsTorchMode: false,
  };

  _didFocus: any;
  _willBlur: any;
  _timer: NodeJS.Timeout | null | undefined;
  _callbackTimestamps: number[] = [];
  _fpsCounterInterval?: NodeJS.Timeout | null | undefined;
  _instructionTimer: NodeJS.Timeout | null | undefined;
  _instructionLastUpdate: number = 0;

  _feedbackChecks: { [key: string]: FeedbackCheck } = {
    exposureFlash: {
      predicate: (readerResult: RDTCapturedArgs) =>
        readerResult.exposureResult === RDTReaderExposureResult.OVER_EXPOSED,
      duration: 5000,
      action: () => this.setState({ flashEnabled: false }),
      cooldown: Infinity,
    },
    notCentered: {
      predicate: (readerResult: RDTCapturedArgs) => !readerResult.isCentered,
      numCorrect: 1,
      numSamples: 2,
      duration: PREDICATE_DURATION_SHORT,
      action: () =>
        this._addInstructionRequest(
          "centered",
          "notCentered",
          "centerStrip",
          true
        ),
      inaction: () => this._removeInstructionRequest("centered", "notCentered"),
      cooldown: 0,
    },
    sizeResultInvalid: {
      predicate: (readerResult: RDTCapturedArgs) =>
        readerResult.sizeResult === RDTReaderSizeResult.INVALID,
      numCorrect: 1,
      numSamples: 2,
      duration: PREDICATE_DURATION_SHORT,
      action: () =>
        this._addInstructionRequest(
          "size",
          "sizeResultInvalid",
          "centerStrip",
          true
        ),
      inaction: () =>
        this._removeInstructionRequest("size", "sizeResultInvalid"),
      cooldown: 0,
    },
    sizeResultLarge: {
      predicate: (readerResult: RDTCapturedArgs) =>
        readerResult.sizeResult === RDTReaderSizeResult.LARGE,
      numCorrect: 1,
      numSamples: 2,
      duration: PREDICATE_DURATION_NORMAL,
      action: () =>
        this._addInstructionRequest(
          "size",
          "sizeResultLarge",
          "sizeResultLarge"
        ),
      inaction: () => this._removeInstructionRequest("size", "sizeResultLarge"),
      cooldown: 0,
    },
    sizeResultSmall: {
      predicate: (readerResult: RDTCapturedArgs) =>
        readerResult.sizeResult === RDTReaderSizeResult.SMALL,
      numCorrect: 1,
      numSamples: 2,
      duration: PREDICATE_DURATION_NORMAL,
      action: () =>
        this._addInstructionRequest(
          "size",
          "sizeResultSmall",
          "sizeResultSmall"
        ),
      inaction: () => this._removeInstructionRequest("size", "sizeResultSmall"),
      cooldown: 0,
    },
    notFocused: {
      predicate: (readerResult: RDTCapturedArgs) => !readerResult.isFocused,
      duration: PREDICATE_DURATION_NORMAL,
      action: () =>
        this._addInstructionRequest("focused", "notFocused", "holdSteady"),
      inaction: () => this._removeInstructionRequest("focused", "notFocused"),
      cooldown: 0,
    },
    badOrientationPos: {
      predicate: (readerResult: RDTCapturedArgs) =>
        !readerResult.isRightOrientation && readerResult.angle > 0,
      duration: PREDICATE_DURATION_NORMAL,
      action: () =>
        this._addInstructionRequest(
          "orientation",
          "badOrientationPos",
          "badOrientationPos"
        ),
      inaction: () =>
        this._removeInstructionRequest("orientation", "badOrientationPos"),
      cooldown: 0,
    },
    badOrientationNeg: {
      predicate: (readerResult: RDTCapturedArgs) =>
        !readerResult.isRightOrientation && readerResult.angle < 0,
      duration: PREDICATE_DURATION_NORMAL,
      action: () =>
        this._addInstructionRequest(
          "orientation",
          "badOrientationNeg",
          "badOrientationNeg"
        ),
      inaction: () =>
        this._removeInstructionRequest("orientation", "badOrientationNeg"),
      cooldown: 0,
    },
    underExposed: {
      predicate: (readerResult: RDTCapturedArgs) =>
        readerResult.exposureResult === RDTReaderExposureResult.UNDER_EXPOSED,
      duration: PREDICATE_DURATION_NORMAL,
      action: () =>
        this._addInstructionRequest("exposure", "underExposed", "underExposed"),
      inaction: () =>
        this._removeInstructionRequest("exposure", "underExposed"),
      cooldown: 0,
    },
    overExposed: {
      predicate: (readerResult: RDTCapturedArgs) =>
        readerResult.exposureResult === RDTReaderExposureResult.OVER_EXPOSED,
      duration: PREDICATE_DURATION_NORMAL,
      action: () =>
        this._addInstructionRequest("exposure", "overExposed", "overExposed"),
      inaction: () => this._removeInstructionRequest("exposure", "overExposed"),
      cooldown: 0,
    },
    noFiducialFound: {
      predicate: (readerResult: RDTCapturedArgs) => !readerResult.fiducialFound,
      duration: PREDICATE_DURATION_NORMAL,
      action: () =>
        this._addInstructionRequest(
          "fiducial",
          "noFiducialFound",
          "holdSteady"
        ),
      inaction: () =>
        this._removeInstructionRequest("fiducial", "noFiducialFound"),
      cooldown: 0,
    },
  };

  _feedbackCheckState: {
    [key: string]: FeedbackCheckState;
  } = {};

  _feedbackInstructionRequests: {
    [key: string]: FeedbackInstructionRequest;
  } = {};

  componentDidMount() {
    const { navigation } = this.props;
    this._didFocus = navigation.addListener("didFocus", this._handleDidFocus);
    this._willBlur = navigation.addListener("willBlur", this._handleWillBlur);
    AppState.addEventListener("change", this._handleAppStateChange);
    AppState.addEventListener("memoryWarning", this._handleMemoryWarning);

    // We need to manually call this here in case the component is being instantiated
    // on first run of the app, or on StackActions.replace. In other words, if the
    // screen that it's a part of isn't being pushed on to the nav stack.
    this._handleDidFocus();
  }

  componentWillUnmount() {
    this._handleWillBlur();
    this._didFocus.remove();
    this._willBlur.remove();
    AppState.removeEventListener("memoryWarning", this._handleMemoryWarning);
    AppState.removeEventListener("change", this._handleAppStateChange);
  }

  _handleDidFocus = () => {
    this._setTimer();
    if (this.props.isDemo && !this._fpsCounterInterval) {
      this._fpsCounterInterval = global.setInterval(
        this._updateFPSCounter,
        1000
      );
    }
  };

  _handleWillBlur = () => {
    this._clearTimer();
    this._clearInstructionTimer();
    if (this._fpsCounterInterval) {
      clearInterval(this._fpsCounterInterval);
      this._fpsCounterInterval = null;
    }
  };

  _setTimer() {
    // Timeout after 30 seconds
    this._clearTimer();
    this._timer = global.setTimeout(() => {
      const { dispatch, fallback, isFocused, navigation } = this.props;
      if (isFocused) {
        logFirebaseEvent(AppEvents.RDT_TIMEOUT);
        dispatch(setRDTCaptureTime(false));
        dispatch(setShownRDTFailWarning(false));
        navigation.push(fallback, {
          supportsTorchMode: this.state.supportsTorchMode,
        });
        dispatch(setRDTPhoto(""));
        dispatch(setRDTPhotoHC(""));
        dispatch(setRDTReaderResult({ testStripFound: false }));
      }
    }, getRemoteConfig("rdtTimeoutSeconds") * 1000);
  }

  _clearTimer() {
    if (this._timer != null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  _handleAppStateChange = async (nextAppState: string) => {
    this.setState({ appState: nextAppState });
    if (nextAppState === "active" && this.state.flashEnabled) {
      // Toggle flash state since the hardware state doesn't seem to get preserved
      // on iOS if the app is backgrounded and then foregrounded.
      this.setState({ flashEnabled: false });
      this.setState({ flashEnabled: true });
    }
  };

  _handleMemoryWarning = () => {
    const { dispatch, fallback, isFocused, navigation } = this.props;
    if (isFocused) {
      // Make sure timer cleanup happens since since this event can fire
      // pre-transition completion and therefore won't trigger willBlur.
      this._handleWillBlur();
      dispatch(setShownRDTFailWarning(false));
      navigation.push(fallback, {
        supportsTorchMode: this.state.supportsTorchMode,
      });
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

  _cameraReady = (args: RDTCameraReadyArgs) => {
    this.setState({
      spinner: false,
      supportsTorchMode: args.supportsTorchMode,
    });
    const { dispatch } = this.props;
    dispatch(setRDTStartTime());
  };

  _addInstructionRequest(
    category: string,
    issue: string,
    msg: string,
    primary?: boolean
  ) {
    if (
      this._feedbackInstructionRequests[category] &&
      this._feedbackInstructionRequests[category].issue === issue
    ) {
      return;
    }
    debug("Adding instruction request: " + category + ":" + issue + "." + msg);

    // Add new instruction to the set of requests
    this._feedbackInstructionRequests[category] = {
      issue,
      msg,
      primary,
      lastRequested: Date.now(),
    };

    this._updateInstructionIfNeeded();
  }

  _removeInstructionRequest(category: string, issue: string) {
    if (
      this._feedbackInstructionRequests[category] &&
      this._feedbackInstructionRequests[category].issue === issue
    ) {
      debug("Removing instruction request: " + category + ":" + issue);

      // Remove the instruction from the set of requests
      let instruction = this._feedbackInstructionRequests[category];
      delete this._feedbackInstructionRequests[category];

      // If the current instruction is being removed, set it to "green" state
      if (instruction.msg === this.state.instructionMsg) {
        this.setState({ instructionIsOK: true });
        this._instructionLastUpdate =
          Date.now() -
          INSTRUCTION_DURATION_NORMAL +
          INSTRUCTION_DURATION_OKTEXT;
      }

      this._updateInstructionIfNeeded();
    }
  }

  _updateInstructionIfNeeded() {
    this._clearInstructionTimer();

    const now = Date.now();

    // Do we have an existing instruction shown? If not, update text immediately.
    if (!this.state.instructionMsg) {
      this._setInstructionText(now);
      return;
    }

    // Has enough time elapased since last instruction text was shown to update immediately?
    const elapsed = now - this._instructionLastUpdate;
    if (elapsed < INSTRUCTION_DURATION_NORMAL) {
      // No, so set timer for remainder of instruction text
      this._instructionTimer = global.setTimeout(() => {
        this._setInstructionText(Date.now());
      }, INSTRUCTION_DURATION_NORMAL - elapsed);
    } else {
      // Yes, so update instruction text immediately
      this._setInstructionText(now);
    }
  }

  _clearInstructionTimer() {
    if (this._instructionTimer != null) {
      clearTimeout(this._instructionTimer);
      this._instructionTimer = null;
    }
  }

  _getNextInstructionMessage() {
    let instruction: FeedbackInstructionRequest = {
      msg: "holdSteady",
      lastRequested: 0,
    };

    // Choose the instruction that:
    // - is primary, OR
    // - is the most recently requested, OR
    // - isn't "no fidicual found" (since that's quite common and can create noise)
    for (let key in this._feedbackInstructionRequests) {
      const instructionRequest = this._feedbackInstructionRequests[key];
      if (
        !instruction.primary &&
        instructionRequest.lastRequested &&
        (instructionRequest.primary ||
          !instruction.lastRequested ||
          instructionRequest.lastRequested > instruction.lastRequested ||
          (instruction.issue && instruction.issue === "noFiducialFound"))
      ) {
        instruction = instructionRequest;
      }
    }

    return instruction;
  }

  _setInstructionText(instructionLastUpdate: number) {
    const instructionToShow = this._getNextInstructionMessage();
    debug("Setting instruction text: " + instructionToShow.msg);
    this.setState({
      instructionMsg: instructionToShow.msg,
      instructionIsOK: false,
    });
    this._instructionLastUpdate = instructionLastUpdate;
  }

  _onRDTInterpreting = (args: RDTInterpretingArgs) => {
    this.setState({ spinner: true });
  };

  _onRDTCaptured = async (args: RDTCapturedArgs) => {
    this.setState({ spinner: false });
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
      const hcPhotoId = await newUID();
      dispatch(setRDTPhoto(`data:image/png;base64,${args.imgBase64}`));
      dispatch(
        setTestStripImg(
          {
            sample_type: "RDTReaderPhotoGUID",
            code: photoId,
          },
          {
            sample_type: "RDTReaderHCPhotoGUID",
            code: hcPhotoId,
          }
        )
      );
      savePhoto(photoId, args.imgBase64);
      savePhoto(hcPhotoId, args.resultWindowImgBase64);
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
      const state = this._feedbackCheckState[key] || {
        active: false,
        avgCorrectness:
          check.numCorrect && check.numSamples
            ? check.numCorrect / check.numSamples
            : undefined,
      };

      const success = check.predicate(args);
      let succeeded = success;
      if (check.numCorrect && check.numSamples && state.avgCorrectness) {
        state.avgCorrectness =
          (state.avgCorrectness * (check.numSamples - 1)) / check.numSamples +
          (success ? 1 / check.numSamples : 0);
        succeeded = state.avgCorrectness >= check.numCorrect / check.numSamples;
      }

      if (!succeeded) {
        if (state.lastRan && check.inaction) {
          check.inaction();
        }
        this._feedbackCheckState[key] = {
          ...state,
          active: false,
          started: undefined,
          lastRan: undefined,
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
    logFirebaseEvent(AppEvents.FLASH_TOGGLE, {
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
    const isPositionValid = ALLOW_ICON_FEEDBACK;
    const isDistanceValid =
      ALLOW_ICON_FEEDBACK &&
      this.state.sizeResult !== RDTReaderSizeResult.INVALID;
    const isRotationValid = ALLOW_ICON_FEEDBACK;
    return (
      <View style={styles.container}>
        <Spinner visible={this.state.spinner && isFocused} />
        <RDTReaderComponent
          style={styles.camera}
          onRDTCaptured={this._onRDTCaptured}
          onRDTCameraReady={this._cameraReady}
          onRDTInterpreting={this._onRDTInterpreting}
          enabled={isFocused}
          showDefaultViewfinder={false}
          flashEnabled={this.state.flashEnabled}
          appState={this.state.appState}
        />
        <View style={styles.overlayContainer}>
          <View style={{ flexDirection: "column", flex: 1 }}>
            <View
              style={[
                styles.backgroundOverlay,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
            >
              <Text
                content={t(this.state.instructionMsg)}
                style={[
                  styles.instructionText,
                  { color: this.state.instructionIsOK ? "lime" : "yellow" },
                ]}
              />
            </View>
            <View
              style={{
                height: "65%",
                flexDirection: "row",
              }}
            >
              <View style={styles.backgroundOverlay}>
                <View style={styles.feedbackContainer}>
                  <View
                    style={[
                      styles.feedbackItem,
                      isPositionValid
                        ? styles.feedbackItemValid
                        : styles.feedbackItemInvalid,
                    ]}
                  >
                    <Image
                      style={styles.feedbackItemIcon}
                      source={{
                        uri: isPositionValid
                          ? this.state.isCentered
                            ? "positiongreen"
                            : "positionyellow"
                          : "positionwhite",
                      }}
                    />
                    <Text
                      content={t("position")}
                      style={styles.feedbackItemText}
                    />
                  </View>
                  <View
                    style={[
                      styles.feedbackItem,
                      isDistanceValid
                        ? styles.feedbackItemValid
                        : styles.feedbackItemInvalid,
                    ]}
                  >
                    <Image
                      style={styles.feedbackItemIcon}
                      source={{
                        uri: isDistanceValid
                          ? this.state.sizeResult ===
                            RDTReaderSizeResult.RIGHT_SIZE
                            ? "distancegreen"
                            : "distanceyellow"
                          : "distancewhite",
                      }}
                    />
                    <Text
                      content={t("distance")}
                      style={styles.feedbackItemText}
                    />
                  </View>
                  <View
                    style={[
                      styles.feedbackItem,
                      isRotationValid
                        ? styles.feedbackItemValid
                        : styles.feedbackItemInvalid,
                    ]}
                  >
                    <Image
                      style={styles.feedbackItemIcon}
                      source={{
                        uri: isRotationValid
                          ? this.state.isRightOrientation
                            ? "rotationgreen"
                            : "rotationyellow"
                          : "rotationwhite",
                      }}
                    />
                    <Text
                      content={t("rotation")}
                      style={styles.feedbackItemText}
                    />
                  </View>
                </View>
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
                        style={styles.feedbackItemText}
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
        {isDemo && (
          <View style={styles.fpsCounter}>
            <Text content={`FPS: ${this.state.fps.toFixed(2)}`} />
          </View>
        )}
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
    marginHorizontal: -SCREEN_MARGIN,
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
  backgroundOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  instructionText: {
    fontSize: LARGE_TEXT,
    flex: 1,
    marginHorizontal: GUTTER,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.99)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
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
  feedbackItemValid: {
    opacity: 1.0,
  },
  feedbackItemInvalid: {
    opacity: ALLOW_ICON_FEEDBACK ? 0.5 : 0,
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
  testStrip: {
    aspectRatio: 0.048,
    flex: 1,
    opacity: 0.5,
  },
  testStripContainer: {
    marginHorizontal: "8%",
    marginVertical: "-4%",
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
