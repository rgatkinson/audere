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
  Alert,
} from "react-native";
import { connect } from "react-redux";
import {
  withNavigationFocus,
  NavigationScreenProp,
  StackActions,
} from "react-navigation";
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
import { uploadFile } from "../../../store";
import {
  logFirebaseEvent,
  AppEvents,
  AppHealthEvents,
} from "../../../util/tracker";
import { getRemoteConfig } from "../../../util/remoteConfig";
import Svg, { Line, Rect } from "react-native-svg";
import { getDevice } from "../../../transport/DeviceInfo";

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
const PREDICATE_DURATION_NORMAL = 1000;
const PREDICATE_DURATION_LONG = 3000;
const INSTRUCTION_DURATION_NORMAL = 2000;
const INSTRUCTION_DURATION_OKTEXT = 1000;
const RDT_ASPECT_RATIO = 4.5 / 87;
const INSTRUCTION_HEIGHT_PCT = 0.25;
const RDT_HEIGHT_PCT = 0.65;
const BOTTOM_HEIGHT_PCT = 1 - INSTRUCTION_HEIGHT_PCT - RDT_HEIGHT_PCT;
const RDT_BUFFER = 128;

function debug(s: string) {
  if (DEBUG_RDT_READER_UX) {
    console.log(`RDT: ${s}`);
  }
}

enum SizeResult {
  UNKNOWN,
  TOO_SMALL,
  TOO_BIG,
  OK,
}

interface State {
  spinner: boolean;
  showCamera: boolean;
  flashEnabled: boolean;
  fps: number;
  instructionMsg: string;
  appState: string;
  supportsTorchMode: boolean;
  legacyCameraApi: boolean;
  frameImageScale: number;
  showFlashToggle: boolean;
  boundary?: { x: number; y: number }[];
  screenWidth: number;
  screenHeight: number;
  failureReason: string;
}

class AndroidRDTReader extends React.Component<Props & WithNamespaces, State> {
  state: State = {
    spinner: false,
    showCamera: false,
    flashEnabled: false,
    fps: 0,
    instructionMsg: "centerStrip",
    appState: "",
    supportsTorchMode: false,
    legacyCameraApi: false,
    frameImageScale: 1,
    showFlashToggle: false,
    screenWidth: 0,
    screenHeight: 0,
    failureReason: "",
  };

  _alertShown: boolean = false;
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
    underExposed: {
      predicate: (readerResult: RDTCapturedArgs) =>
        readerResult.exposureResult === RDTReaderExposureResult.UNDER_EXPOSED,
      duration: PREDICATE_DURATION_LONG,
      action: () => {
        this.setState({ showFlashToggle: true });
        this._addInstructionRequest("exposure", "underExposed", "underExposed");
      },
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
    overExposedWithFlash: {
      predicate: (readerResult: RDTCapturedArgs) =>
        readerResult.exposureResult === RDTReaderExposureResult.OVER_EXPOSED &&
        this.state.flashEnabled,
      duration: PREDICATE_DURATION_NORMAL,
      action: () =>
        this._addInstructionRequest(
          "exposure",
          "overExposedWithFlash",
          "overExposedWithFlash"
        ),
      inaction: () =>
        this._removeInstructionRequest("exposure", "overExposedWithFlash"),
      cooldown: 0,
    },
    tooSmall: {
      predicate: (readerResult: RDTCapturedArgs) =>
        this._getSizeResult(readerResult.testStripBoundary) ==
        SizeResult.TOO_SMALL,
      duration: PREDICATE_DURATION_NORMAL,
      action: () => this._addInstructionRequest("size", "tooSmall", "tooSmall"),
      inaction: () => this._removeInstructionRequest("size", "tooSmall"),
      cooldown: 0,
    },
    tooBig: {
      predicate: (readerResult: RDTCapturedArgs) =>
        this._getSizeResult(readerResult.testStripBoundary) ==
        SizeResult.TOO_BIG,
      duration: PREDICATE_DURATION_NORMAL,
      action: () => this._addInstructionRequest("size", "tooBig", "tooBig"),
      inaction: () => this._removeInstructionRequest("size", "tooBig"),
      cooldown: 0,
    },
    holdSteady: {
      predicate: (readerResult: RDTCapturedArgs) =>
        readerResult.testStripDetected && readerResult.isCentered,
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
    if (!this._alertShown) {
      const { navigation, t } = this.props;
      this._alertShown = true;
      Alert.alert(
        t("alertTitle"),
        t("alertDesc"),
        [
          {
            text: t("goBack"),
            onPress: () => {
              navigation.dispatch(StackActions.pop({ n: 1 }));
            },
          },
          {
            text: t("start"),
            onPress: () => {
              this.setState({ spinner: true, showCamera: true });
              this._startCamera();
            },
          },
        ],
        { cancelable: false }
      );
    } else if (this.state.showCamera) {
      this._startCamera();
    }
  };

  _startCamera = () => {
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
    // Timeout after 30 seconds
    this._timer = global.setTimeout(() => {
      const { dispatch, fallback, isFocused, navigation } = this.props;
      if (!this._interpreting && isFocused) {
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
            this._lastRDTReaderResult || { testStripDetected: false }
          )
        );
        dispatch(
          setRDTCaptureInfo(
            this.state.supportsTorchMode && this.state.flashEnabled,
            this.state.legacyCameraApi
          )
        );
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
          testStripDetected: false,
          skippedDueToMemWarning: true,
        })
      );
    }
  };

  componentWillReceiveProps(nextProps: Props) {
    if (!this.props.isFocused && nextProps.isFocused) {
      this.setState({ spinner: true, flashEnabled: false });
    }
  }

  _cameraReady = (args: RDTCameraReadyArgs) => {
    this.setState({
      spinner: false,
      supportsTorchMode: args.supportsTorchMode,
      screenWidth: args.screenWidth,
      screenHeight: args.screenHeight,
      legacyCameraApi: args.legacyCameraApi,
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
    for (let key in this._feedbackInstructionRequests) {
      const instructionRequest = this._feedbackInstructionRequests[key];
      if (
        !instruction.primary &&
        instructionRequest.lastRequested &&
        (instructionRequest.primary ||
          !instruction.lastRequested ||
          instructionRequest.lastRequested > instruction.lastRequested)
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
    this.setState({ spinner: true, failureReason: "Interpreting..." });
    this._interpreting = true;
  };

  _onRDTCaptured = async (args: RDTCapturedArgs) => {
    this.setState({
      spinner: false,
      boundary: args.testStripBoundary,
      failureReason: args.failureReason,
    });
    this._updateFeedback(args);
    if (this.props.isDemo) {
      this._callbackTimestamps.push(Date.now());
    }

    if (!args.imageUri) {
      this._lastRDTReaderResult = rdtCapturedArgsToResult(args);
      return;
    }

    const { dispatch, navigation, next } = this.props;
    dispatch(setRDTCaptureTime(true));
    try {
      const photoId = await newUID();
      const testAreaPhotoId = await newUID();
      dispatch(setRDTPhoto(args.imageUri));
      dispatch(setRDTPhotoHC(args.resultWindowImageUri));
      dispatch(
        setTestStripImg(
          {
            sample_type: "RDTReaderPhotoGUID",
            code: photoId,
          },
          {
            sample_type: "RDTTestAreaPhotoGUID",
            code: testAreaPhotoId,
          }
        )
      );
      uploadFile(photoId, args.imageUri);
      uploadFile(testAreaPhotoId, args.resultWindowImageUri);
      dispatch(setRDTReaderResult(rdtCapturedArgsToResult(args)));
      dispatch(
        setRDTCaptureInfo(
          this.state.supportsTorchMode && this.state.flashEnabled,
          this.state.legacyCameraApi
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
        testStripDetected: true,
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
        testStripDetected: true,
        controlLineFound: true,
        testALineFound: true,
        testBLineFound: false,
      })
    );
    navigation.dispatch(StackActions.push({ routeName: next }));
  };

  _getCurrentRdtPosition = (boundary: { x: number; y: number }[]) => {
    const upsideDown = boundary[0].y > boundary[3].y;

    return {
      left: upsideDown ? boundary[1].x : boundary[0].x,
      top: upsideDown ? boundary[3].y : boundary[0].y,
      right: upsideDown ? boundary[0].x : boundary[1].x,
      bottom: upsideDown ? boundary[0].y : boundary[3].y,
    };
  };

  _getSizeResult = (boundary?: { x: number; y: number }[]) => {
    if (
      boundary == null ||
      this.state.screenWidth == 0 ||
      this.state.screenHeight == 0
    ) {
      return SizeResult.UNKNOWN;
    }

    const desired = this._getDesiredRdtPosition(
      this.state.screenHeight,
      this.state.screenWidth
    );
    const current = this._getCurrentRdtPosition(boundary);

    if (
      current.top > desired.top + RDT_BUFFER &&
      current.bottom < desired.bottom - RDT_BUFFER &&
      Math.abs(current.left - desired.left) < RDT_BUFFER &&
      Math.abs(current.right - desired.right) < RDT_BUFFER
    ) {
      return SizeResult.TOO_SMALL;
    } else if (
      current.top < desired.top - RDT_BUFFER &&
      current.bottom > desired.bottom + RDT_BUFFER &&
      Math.abs(current.left - desired.left) < RDT_BUFFER &&
      Math.abs(current.right - desired.right) < RDT_BUFFER
    ) {
      return SizeResult.TOO_BIG;
    }

    return SizeResult.OK;
  };

  _getDesiredRdtPosition = (height: number, width: number) => {
    const rdtHeight = height * RDT_HEIGHT_PCT;
    const rdtWidth = rdtHeight * RDT_ASPECT_RATIO;

    const rdtLeft = width / 2 - rdtWidth / 2;
    const rdtTop = height * INSTRUCTION_HEIGHT_PCT;

    return {
      left: rdtLeft,
      top: rdtTop,
      right: rdtLeft + rdtWidth,
      bottom: rdtTop + rdtHeight,
    };
  };

  _getRdtOutline = () => {
    const { boundary, screenWidth, screenHeight } = this.state;
    if (screenWidth == 0 || screenHeight == 0) {
      return null;
    }

    const desired = this._getDesiredRdtPosition(screenHeight, screenWidth);

    let topLeft, topRight, bottomLeft, bottomRight;
    topLeft = topRight = bottomLeft = bottomRight = "red";

    if (boundary != null && boundary.length > 3) {
      const current = this._getCurrentRdtPosition(boundary);

      if (
        Math.abs(current.left - desired.left) < RDT_BUFFER &&
        Math.abs(current.top - desired.top) < RDT_BUFFER
      ) {
        topLeft = PROGRESS_COLOR;
      }

      if (
        Math.abs(current.right - desired.right) < RDT_BUFFER &&
        Math.abs(current.top - desired.top) < RDT_BUFFER
      ) {
        topRight = PROGRESS_COLOR;
      }

      if (
        Math.abs(current.left - desired.left) < RDT_BUFFER &&
        Math.abs(current.bottom - desired.bottom) < RDT_BUFFER
      ) {
        bottomLeft = PROGRESS_COLOR;
      }

      if (
        Math.abs(current.right - desired.right) < RDT_BUFFER &&
        Math.abs(current.bottom - desired.bottom) < RDT_BUFFER
      ) {
        bottomRight = PROGRESS_COLOR;
      }
    }

    const STROKE = 10;
    const VERT_LINE_LENGTH = 75;
    const HORIZ_LINE_LENGTH = 25;

    const lines = [
      <Line
        x1={desired.left - STROKE}
        y1={desired.top - STROKE / 2}
        x2={desired.left + HORIZ_LINE_LENGTH}
        y2={desired.top - STROKE / 2}
        stroke={topLeft}
        strokeWidth={STROKE}
        key="topLeftH"
      />,
      <Line
        x1={desired.left - STROKE / 2}
        y1={desired.top - STROKE / 2}
        x2={desired.left - STROKE / 2}
        y2={desired.top + VERT_LINE_LENGTH}
        stroke={topLeft}
        strokeWidth={STROKE}
        key="topLeftV"
      />,
      <Line
        x1={desired.right + STROKE}
        y1={desired.top - STROKE / 2}
        x2={desired.right - HORIZ_LINE_LENGTH}
        y2={desired.top - STROKE / 2}
        stroke={topRight}
        strokeWidth={STROKE}
        key="topRightH"
      />,
      <Line
        x1={desired.right + STROKE / 2}
        y1={desired.top - STROKE / 2}
        x2={desired.right + STROKE / 2}
        y2={desired.top + VERT_LINE_LENGTH}
        stroke={topRight}
        strokeWidth={STROKE}
        key="topRightV"
      />,
      <Line
        x1={desired.left - STROKE}
        y1={desired.bottom + STROKE / 2}
        x2={desired.left + HORIZ_LINE_LENGTH}
        y2={desired.bottom + STROKE / 2}
        stroke={bottomLeft}
        strokeWidth={STROKE}
        key="bottomLeftH"
      />,
      <Line
        x1={desired.left - STROKE / 2}
        y1={desired.bottom + STROKE / 2}
        x2={desired.left - STROKE / 2}
        y2={desired.bottom - VERT_LINE_LENGTH}
        stroke={bottomLeft}
        strokeWidth={STROKE}
        key="bottomLeftV"
      />,
      <Line
        x1={desired.right + STROKE}
        y1={desired.bottom + STROKE / 2}
        x2={desired.right - HORIZ_LINE_LENGTH}
        y2={desired.bottom + STROKE / 2}
        stroke={bottomRight}
        strokeWidth={STROKE}
        key="bottomRightH"
      />,
      <Line
        x1={desired.right + STROKE / 2}
        y1={desired.bottom + STROKE / 2}
        x2={desired.right + STROKE / 2}
        y2={desired.bottom - VERT_LINE_LENGTH}
        stroke={bottomRight}
        strokeWidth={STROKE}
        key="bottomRightV"
      />,
    ];

    const viewBox = "0 0 " + " " + screenWidth + " " + screenHeight;
    return (
      <View style={styles.overlayContainer}>
        <Svg height="100%" width="100%" viewBox={viewBox}>
          {lines}
        </Svg>
      </View>
    );
  };

  _getFlashToggle = () => {
    if (this.state.supportsTorchMode && this.state.showFlashToggle) {
      const { t } = this.props;
      return (
        <View style={styles.overlayContainer}>
          <View style={{ flex: 3 }} />
          <View style={{ flex: 1 }} />
          <View style={{ flex: 3 }}>
            <TouchableOpacity onPress={this._toggleFlash}>
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <Image
                  style={styles.feedbackItemIcon}
                  source={{
                    uri: this.state.flashEnabled ? "flashon" : "flashoff",
                  }}
                />
                <Text
                  content={
                    t("flash") + (this.state.flashEnabled ? t("on") : t("off"))
                  }
                  style={styles.feedbackItemText}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return null;
  };

  render() {
    const { isDemo, isFocused, t } = this.props;
    if (!isFocused) {
      return null;
    }
    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />
        <Spinner visible={this.state.spinner} />
        {this.state.showCamera && (
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
        )}
        <View style={styles.overlayContainer}>
          <View style={{ flex: 1 }}>
            <View
              style={[
                styles.backgroundOverlay,
                { flex: INSTRUCTION_HEIGHT_PCT },
              ]}
            >
              <View style={styles.instructionContainer}>
                <View style={styles.instructionTextContainer}>
                  <Text
                    content={t(this.state.instructionMsg, getDevice())}
                    style={styles.instructionText}
                  />
                </View>
              </View>
            </View>
            <View style={{ flex: RDT_HEIGHT_PCT, flexDirection: "row" }}>
              <View style={[styles.backgroundOverlay, { flex: 1 }]} />
              <View style={styles.testStripContainer}>
                <View style={styles.testStripViewfinder} />
              </View>
              <View style={[styles.backgroundOverlay, { flex: 1 }]} />
            </View>
            <View
              style={[
                styles.backgroundOverlay,
                { flex: BOTTOM_HEIGHT_PCT, justifyContent: "flex-end" },
              ]}
            >
              {isDemo && (
                <View
                  style={{
                    backgroundColor: "black",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text content={this.state.failureReason} />
                  <Text content={`FPS: ${this.state.fps.toFixed(2)}`} />
                </View>
              )}
            </View>
          </View>
        </View>
        {this._getRdtOutline()}
        {this._getFlashToggle()}
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
}))(withNavigationFocus(withNamespaces("RDTReader")(AndroidRDTReader)));

function rdtCapturedArgsToResult(args: RDTCapturedArgs): RDTReaderResult {
  return {
    testStripDetected: args.testStripDetected,
    testStripBoundary: args.testStripBoundary,
    isCentered: args.isCentered,
    isFocused: args.isFocused,
    isSteady: args.isSteady,
    exposureResult: args.exposureResult,
    controlLineFound: args.controlLineFound,
    testALineFound: args.testALineFound,
    testBLineFound: args.testBLineFound,
    intermediateResults: args.intermediateResults,
    phase1Recognitions: args.phase1Recognitions,
    phase2Recognitions: args.phase2Recognitions,
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
  feedbackItemIcon: {
    height: 32,
    width: 32,
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
    padding: GUTTER,
  },
  instructionText: {
    alignSelf: "stretch",
    color: "white",
    fontSize: REGULAR_TEXT,
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
  testStripViewfinder: {
    aspectRatio: RDT_ASPECT_RATIO,
    height: "100%",
  },
  testStripContainer: {
    alignItems: "center",
    justifyContent: "center",
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
