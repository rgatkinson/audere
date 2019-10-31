// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  AppState,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { connect } from "react-redux";
import {
  withNavigationFocus,
  NavigationScreenProp,
  StackActions,
} from "react-navigation";
import { Feather } from "@expo/vector-icons";
import ProgressCircle from "react-native-progress-circle";
import Spinner from "react-native-loading-spinner-overlay";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  Action,
  setTestStripImg,
  setRDTStartTime,
  setRDTCaptureInfo,
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
  RDTReaderResult,
  RDTReaderExposureResult,
} from "audere-lib/chillsProtocol";
import {
  BUTTON_BORDER_RADIUS,
  GUTTER,
  SCREEN_MARGIN,
  PRIMARY_COLOR,
  PROGRESS_COLOR,
  RED,
  REGULAR_TEXT,
  SECONDARY_COLOR,
  SMALL_TEXT,
  THICK_BORDER_WIDTH,
} from "../../styles";
import { savePhoto } from "../../../store";
import {
  logFirebaseEvent,
  AppEvents,
  AppHealthEvents,
} from "../../../util/tracker";
import { getRemoteConfig } from "../../../util/remoteConfig";
import Svg, { Line, Rect } from "react-native-svg";

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
const ALLOW_ICON_FEEDBACK = false; // Show iconic feedback during capture
const PREDICATE_DURATION_SHORT = 500;
const PREDICATE_DURATION_NORMAL = 1000;
const PREDICATE_DURATION_LONG = 3000;
const INSTRUCTION_DURATION_NORMAL = 2000;
const INSTRUCTION_DURATION_OKTEXT = 1000;
const RDT_ASPECT_RATIO = 5.0 / 87;
const RDT_MARGIN = 20;

function debug(s: string) {
  if (DEBUG_RDT_READER_UX) {
    console.log(`RDT: ${s}`);
  }
}

class AndroidRDTReader extends React.Component<Props & WithNamespaces> {
  state = {
    showInstructions: true,
    spinner: true,
    exposureResult: RDTReaderExposureResult.UNDER_EXPOSED,
    flashEnabled: false,
    flashEnabledAutomatically: false,
    fps: 0,
    instructionMsg: "centerStrip",
    appState: "",
    supportsTorchMode: false,
    frameImageScale: 1,
    progress: 0,
    stripFound: false,
    boundary: null,
    viewport: null,
  };

  _didFocus: any;
  _willBlur: any;
  _timer: NodeJS.Timeout | null | undefined;
  _callbackTimestamps: number[] = [];
  _fpsCounterInterval?: NodeJS.Timeout | null | undefined;
  _instructionTimer: NodeJS.Timeout | null | undefined;
  _instructionLastUpdate: number = 0;
  _lastRDTReaderResult?: RDTReaderResult;
  _interpreting: boolean = false;
  _rdtRect: any = null;

  _feedbackChecks: { [key: string]: FeedbackCheck } = {
    exposureFlash: {
      predicate: (readerResult: RDTCapturedArgs) =>
        readerResult.testStripDetected &&
        readerResult.exposureResult === RDTReaderExposureResult.UNDER_EXPOSED,
      duration: PREDICATE_DURATION_LONG,
      action: () =>
        this.setState({
          flashEnabled: true,
          flashEnabledAutomatically: true,
        }),
      cooldown: Infinity,
    },
    underExposed: {
      predicate: (readerResult: RDTCapturedArgs) =>
        readerResult.testStripDetected &&
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
        readerResult.testStripDetected &&
        readerResult.exposureResult === RDTReaderExposureResult.OVER_EXPOSED,
      duration: PREDICATE_DURATION_NORMAL,
      action: () =>
        this._addInstructionRequest("exposure", "overExposed", "overExposed"),
      inaction: () => this._removeInstructionRequest("exposure", "overExposed"),
      cooldown: 0,
    },
    holdSteady: {
      predicate: (readerResult: RDTCapturedArgs) =>
        readerResult.testStripDetected,
      duration: 0,
      action: () =>
        this._addInstructionRequest("holdSteady", "holdSteady", "holdSteady"),
      inaction: () =>
        this._removeInstructionRequest("holdSteady", "holdSteady"),
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
    this._interpreting = false;
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
    this._clearTimer();
    if (this.state.showInstructions) {
      this._timer = global.setTimeout(() => {
        this._closeInstructions();
      }, 8000);
    } else {
      // Timeout after 30 seconds
      this._timer = global.setTimeout(() => {
        const { dispatch, fallback, isFocused, navigation } = this.props;
        if (this.state.progress < 0.5 && !this._interpreting && isFocused) {
          logFirebaseEvent(AppEvents.RDT_TIMEOUT);
          dispatch(setRDTCaptureTime(false));
          dispatch(setShownRDTFailWarning(false));
          navigation.dispatch(
            StackActions.push({
              routeName: fallback,
              params: {
                supportsTorchMode: this.state.supportsTorchMode,
              },
            })
          );
          dispatch(setRDTPhoto(""));
          dispatch(setRDTPhotoHC(""));
          dispatch(
            setRDTReaderResult(
              this._lastRDTReaderResult || { testStripFound: false }
            )
          );
          dispatch(
            setRDTCaptureInfo(
              this.state.supportsTorchMode && this.state.flashEnabled,
              this.state.supportsTorchMode &&
                this.state.flashEnabledAutomatically
            )
          );
        }
      }, getRemoteConfig("rdtTimeoutSeconds") * 1000);
    }
  }

  _clearTimer() {
    if (this._timer != null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  _handleAppStateChange = async (nextAppState: string) => {
    this.setState({ appState: nextAppState });
  };

  _handleMemoryWarning = () => {
    logFirebaseEvent(AppHealthEvents.LOW_MEMORY_WARNING);
    if (this.state.frameImageScale === 1) {
      this.setState({ frameImageScale: 0.5 });
      logFirebaseEvent(AppHealthEvents.REDUCED_FRAME_SCALE);
      return;
    }
    if (!getRemoteConfig("advanceRDTCaptureOnMemoryWarning")) {
      return;
    }

    const { dispatch, fallback, isFocused, navigation } = this.props;
    if (isFocused) {
      // Make sure timer cleanup happens since since this event can fire
      // pre-transition completion and therefore won't trigger willBlur.
      this._handleWillBlur();
      dispatch(setShownRDTFailWarning(false));
      navigation.dispatch(
        StackActions.push({
          routeName: fallback,
          params: {
            supportsTorchMode: this.state.supportsTorchMode,
          },
        })
      );
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
      // supportsTorchMode: args.supportsTorchMode,
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
      msg: "centerStrip",
      lastRequested: 0,
    };

    // Choose the instruction that:
    // - is primary, OR
    // - is the most recently requested, OR
    // - isn't "holdSteady" (since that's lower priority than any other eligible messages)
    for (let key in this._feedbackInstructionRequests) {
      const instructionRequest = this._feedbackInstructionRequests[key];
      if (
        !instruction.primary &&
        instructionRequest.lastRequested &&
        (instructionRequest.primary ||
          !instruction.lastRequested ||
          instructionRequest.lastRequested > instruction.lastRequested ||
          (instruction.issue && instruction.issue === "holdSteady"))
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
    });
    this._instructionLastUpdate = instructionLastUpdate;
  }

  _onRDTInterpreting = (args: RDTInterpretingArgs) => {
    this.setState({ spinner: true });
    this._interpreting = true;
  };

  _onRDTCaptured = async (args: RDTCapturedArgs) => {
    this.setState({
      spinner: false,
      progress: args.progress,
      stripFound: args.testStripDetected,
      boundary: args.testStripBoundary,
      viewport: args.viewportDimensions,
    });
    this._updateFeedback(args);
    if (this.props.isDemo) {
      this._callbackTimestamps.push(Date.now());
    }

    if (!args.imgBase64) {
      this._lastRDTReaderResult = rdtCapturedArgsToResult(args);
      return;
    }

    const { dispatch, navigation, next } = this.props;
    dispatch(setRDTCaptureTime(true));
    try {
      const photoId = await newUID();
      dispatch(setRDTPhoto(`file://${args.imgBase64}`));
      dispatch(
        setTestStripImg({
          sample_type: "RDTReaderPhotoGUID",
          code: photoId,
        })
      );
      savePhoto(photoId, args.imgBase64);
      dispatch(setRDTReaderResult(rdtCapturedArgsToResult(args)));
      dispatch(
        setRDTCaptureInfo(
          this.state.supportsTorchMode && this.state.flashEnabled,
          this.state.supportsTorchMode && this.state.flashEnabledAutomatically
        )
      );
      navigation.dispatch(StackActions.push({ routeName: next }));
    } catch (e) {
      console.log(e);
    }
  };

  _updateFeedback = (args: RDTCapturedArgs) => {
    for (let key in this._feedbackChecks) {
      const check = this._feedbackChecks[key];
      const state = this._feedbackCheckState[key] || { active: false };

      const success = check.predicate(args);
      if (!success) {
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
    navigation.dispatch(StackActions.push({ routeName: next }));
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
    navigation.dispatch(StackActions.push({ routeName: next }));
  };

  _getLines = (boundary: { x: number; y: number }[] | null, color: string) => {
    if (boundary == null) {
      return null;
    }
    const lines = [];

    const shifts = [-1, -1, 1, 1, -1, -1].map(x => x * RDT_MARGIN);

    let i = 0;
    for (i = 0; i < boundary.length - 1; i += 2) {
      lines.push(
        <Line
          key={"line:" + i}
          x1={boundary[i].x + shifts[i / 2 + 1]}
          y1={boundary[i].y + shifts[i / 2]}
          x2={boundary[i + 1].x + shifts[i / 2 + 2]}
          y2={boundary[i + 1].y + shifts[i / 2 + 1]}
          stroke={color}
          strokeDasharray="15, 15"
          strokeWidth="10"
        />
      );
    }
    return lines;
  };

  _getDesiredRdtOutline = () => {
    if (this._rdtRect == null) {
      const { viewport } = this.state;

      if (viewport == null) {
        return null;
      }

      const { height, width } = viewport!;

      const rdtHeight = height * 0.65 * 0.9 + 2 * RDT_MARGIN;
      const rdtWidth = rdtHeight * RDT_ASPECT_RATIO + 2 * RDT_MARGIN;

      const left = width / 2 - rdtWidth / 2;
      const top = height * 0.25 + height * 0.65 * 0.05 - RDT_MARGIN;

      this._rdtRect = (
        <Rect
          x={left}
          y={top}
          width={rdtWidth}
          height={rdtHeight}
          stroke={PROGRESS_COLOR}
          strokeWidth={10}
          fillOpacity={0}
        />
      );
    }

    return this._rdtRect;
  };

  _getRdtOutline = () => {
    const { stripFound, boundary, viewport } = this.state;

    if (viewport == null) {
      return null;
    }

    const { height, width } = viewport!;

    const shape = !stripFound
      ? this._getLines(boundary, RED)
      : this._getDesiredRdtOutline();

    const viewBox = "0 0 " + " " + width + " " + height;
    return (
      <View style={styles.overlayContainer}>
        <Svg height="100%" width="100%" viewBox={viewBox}>
          {shape}
        </Svg>
      </View>
    );
  };

  _closeInstructions = () => {
    this.setState({ showInstructions: false });
    this._setTimer();
  };

  _getInstructionOverlay = () => {
    if (!this.state.showInstructions) {
      return null;
    }

    const { t } = this.props;
    return (
      <View
        style={[
          styles.overlayContainer,
          { alignItems: "flex-start", paddingTop: "5%" },
        ]}
      >
        <View style={styles.instructionOverlayContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={this._closeInstructions}
          >
            <Feather
              color={SECONDARY_COLOR}
              name="x"
              size={40}
              style={{ margin: GUTTER / 4 }}
            />
          </TouchableOpacity>
          <View style={styles.instructionOverlay}>
            <Text content={t("instructions")} bold={true} center={true} />
            <Text
              content={t("instructionsSubText")}
              center={true}
              style={{ fontSize: SMALL_TEXT, paddingVertical: GUTTER }}
            />
            <Image source={{ uri: "holdphone" }} style={styles.overlayImage} />
          </View>
        </View>
      </View>
    );
  };

  render() {
    const { isDemo, isFocused, t } = this.props;
    if (!isFocused) {
      return null;
    }
    const isPositionValid = ALLOW_ICON_FEEDBACK;
    const isRotationValid = ALLOW_ICON_FEEDBACK;
    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />
        <Spinner visible={this.state.progress == 100 || this.state.spinner} />
        <RDTReaderComponent
          style={styles.camera}
          onRDTCaptured={this._onRDTCaptured}
          onRDTCameraReady={this._cameraReady}
          onRDTInterpreting={this._onRDTInterpreting}
          enabled={isFocused}
          showDefaultViewfinder={false}
          demoMode={isDemo}
          flashEnabled={this.state.flashEnabled}
          frameImageScale={1}
          appState={this.state.appState}
        />
        <View style={styles.overlayContainer}>
          <View style={{ flex: 1 }}>
            <View style={[styles.backgroundOverlay, { flex: 25 }]}>
              <View style={styles.instructionContainer}>
                <View style={styles.instructionTextContainer}>
                  <Text
                    content={t(this.state.instructionMsg)}
                    style={styles.instructionText}
                  />
                </View>
                <View style={styles.progressCircleContainer}>
                  <ProgressCircle
                    percent={this.state.progress}
                    radius={40}
                    borderWidth={6}
                    color={PROGRESS_COLOR}
                    shadowColor="#999"
                    bgColor="rgba(52, 52, 52, 1)"
                  >
                    <Text
                      content={this.state.progress + "%"}
                      style={styles.feedbackItemText}
                    />
                  </ProgressCircle>
                </View>
              </View>
            </View>
            <View
              style={{
                flex: 65,
                flexDirection: "row",
              }}
            >
              <View style={[styles.backgroundOverlay, { flex: 1 }]} />
              <View style={styles.testStripContainer}>
                {this.state.stripFound ? (
                  <View style={styles.testStripViewfinder} />
                ) : (
                  <Image
                    style={styles.testStrip}
                    source={{ uri: "teststrip2" }}
                    resizeMode={"contain"}
                  />
                )}
              </View>
              <View style={[styles.backgroundOverlay, { flex: 1 }]} />
            </View>
            <View style={[styles.backgroundOverlay, { flex: 10 }]} />
          </View>
        </View>
        {this._getRdtOutline()}
        {this._getInstructionOverlay()}
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
          <View>
            <Text content={`FPS: ${this.state.fps.toFixed(2)}`} />
          </View>
        )}
      </View>
    );
  }
}
export default connect((state: StoreState) => ({
  isDemo: state.meta.isDemo,
}))(withNavigationFocus(withNamespaces("RDTReader")(AndroidRDTReader)));

function rdtCapturedArgsToResult(args: RDTCapturedArgs): RDTReaderResult {
  return {
    testStripFound: args.testStripFound,
    exposureResult: args.exposureResult,
    controlLineFound: args.controlLineFound,
    testALineFound: args.testALineFound,
    testBLineFound: args.testBLineFound,
  };
}

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
  overlayImage: {
    aspectRatio: 1,
    width: "85%",
  },
  closeButton: {
    alignSelf: "flex-end",
  },
  instructionOverlayContainer: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: SECONDARY_COLOR,
    borderRadius: BUTTON_BORDER_RADIUS,
    borderWidth: THICK_BORDER_WIDTH,
    width: "90%",
  },
  instructionOverlay: {
    alignItems: "center",
    paddingHorizontal: GUTTER,
    paddingBottom: GUTTER,
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
    backgroundColor: "rgba(51,51,51, 0.6)",
  },
  instructionContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 10,
    flexDirection: "row",
    margin: GUTTER,
    flex: 1,
  },
  instructionTextContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 3,
    padding: GUTTER,
  },
  instructionText: {
    alignSelf: "stretch",
    color: "white",
    fontSize: REGULAR_TEXT,
  },
  progressCircleContainer: {
    flex: 1,
    paddingRight: GUTTER,
  },
  feedbackItemText: {
    alignItems: "center",
    color: "white",
    fontSize: REGULAR_TEXT,
    justifyContent: "center",
    marginVertical: GUTTER,
    textAlign: "center",
  },
  testStripViewfinder: {
    aspectRatio: RDT_ASPECT_RATIO,
    height: "90%",
  },
  testStrip: {
    aspectRatio: RDT_ASPECT_RATIO,
    height: "90%",
    opacity: 0.5,
  },
  testStripContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: "5%",
    flexDirection: "column",
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
});
