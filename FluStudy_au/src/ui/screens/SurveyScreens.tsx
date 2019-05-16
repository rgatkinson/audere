// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { Fragment } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { Camera } from "expo";
import Spinner from "react-native-loading-spinner-overlay";
import DeviceInfo from "react-native-device-info";
import { SampleInfo } from "audere-lib/feverProtocol";
import {
  Action,
  Option,
  StoreState,
  setRDTPhoto,
  setTestStripImg,
  uploader,
} from "../../store";
import timerWithConfigProps, { TimerProps } from "../components/Timer";
import { newCSRUID } from "../../util/csruid";
import BorderView from "../components/BorderView";
import Chrome from "../components/Chrome";
import Screen from "../components/Screen";
import Text from "../components/Text";
import TextInput from "../components/TextInput";
import {
  ASPECT_RATIO,
  BORDER_RADIUS,
  BUTTON_WIDTH,
  ERROR_COLOR,
  GUTTER,
  LARGE_TEXT,
  SECONDARY_COLOR,
  SYSTEM_PADDING_BOTTOM,
} from "../styles";
import { tracker, FunnelEvents } from "../../util/tracker";
import { savePhoto } from "../../store/FirebaseStore";

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const TEST_STRIP_MS = 10 * MINUTE_MS;

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

interface FirstTimerProps {
  oneMinuteStartTime: number | undefined;
}

interface DemoModeProps {
  isDemo: boolean;
}

@connect((state: StoreState) => ({
  isDemo: state.meta.isDemo,
}))
class FirstTimerScreen extends React.Component<
  Props & DemoModeProps & FirstTimerProps & WithNamespaces & TimerProps
> {
  _onTitlePress = () => {
    this.props.isDemo && this.props.onFastForward();
  };

  _onNext = () => {
    this.props.onNext();
    this.props.navigation.push("RemoveSwabFromTube");
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        desc={this.props.getRemainingTime() > 30 * 1000 ? t("tip") : t("tip2")}
        footer={
          <View
            style={{
              alignSelf: "stretch",
              alignItems: "center",
              marginBottom: GUTTER,
            }}
          >
            {!this.props.done() && (
              <View style={{ alignSelf: "stretch" }}>
                <Text
                  content={t("note")}
                  style={{ alignSelf: "stretch", marginBottom: GUTTER }}
                />
                <BorderView
                  style={{
                    alignSelf: "center",
                    borderRadius: BORDER_RADIUS,
                    width: BUTTON_WIDTH,
                  }}
                >
                  <Text
                    bold={true}
                    content={this.props.getRemainingLabel()}
                    style={{ color: SECONDARY_COLOR }}
                  />
                </BorderView>
              </View>
            )}
          </View>
        }
        image="oneminutetimer"
        navigation={this.props.navigation}
        skipButton={!this.props.done()}
        title={t("title")}
        onNext={this._onNext}
        onTitlePress={this._onTitlePress}
      />
    );
  }
}
export const FirstTimer = timerWithConfigProps({
  totalTimeMs: MINUTE_MS,
  startTimeConfig: "oneMinuteStartTime",
  nextScreen: "RemoveSwabFromTube",
})(withNamespaces("firstTimerScreen")(FirstTimerScreen));

interface ThankYouSurveyProps {
  tenMinuteStartTime: number | undefined;
}

@connect((state: StoreState) => ({
  isDemo: state.meta.isDemo,
  tenMinuteStartTime: state.survey.tenMinuteStartTime,
}))
class ThankYouSurveyScreen extends React.Component<
  Props & DemoModeProps & WithNamespaces & ThankYouSurveyProps & TimerProps
> {
  componentDidMount() {
    tracker.logEvent(FunnelEvents.COMPLETED_SURVEY);
  }

  _onNext = () => {
    this.props.onNext();
    this.props.navigation.push("TestStripReady");
  };

  _onTitlePress = () => {
    this.props.isDemo && this.props.onFastForward();
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        desc={t("desc")}
        footer={
          this.props.done() ? (
            undefined
          ) : (
            <BorderView
              style={{
                alignSelf: "center",
                borderRadius: BORDER_RADIUS,
                width: BUTTON_WIDTH,
              }}
            >
              <Text
                bold={true}
                content={this.props.getRemainingLabel()}
                style={{ color: SECONDARY_COLOR }}
              />
            </BorderView>
          )
        }
        image="questionsthankyou"
        navigation={this.props.navigation}
        skipButton={!this.props.done()}
        title={t("title")}
        onNext={this._onNext}
        onTitlePress={this._onTitlePress}
      >
        {!this.props.done() && (
          <Text content={t("waiting")} style={{ alignSelf: "stretch" }} />
        )}
      </Screen>
    );
  }
}
export const ThankYouSurvey = timerWithConfigProps({
  totalTimeMs: TEST_STRIP_MS,
  startTimeConfig: "tenMinuteStartTime",
  nextScreen: "TestStripReady",
})(withNamespaces("thankYouSurveyScreen")(ThankYouSurveyScreen));

@connect()
class RDTReaderScreen extends React.Component<Props & WithNamespaces> {
  camera = React.createRef<any>();

  constructor(props: Props & WithNamespaces) {
    super(props);
    this._takePicture = this._takePicture.bind(this);
  }

  state = {
    spinner: !DeviceInfo.isEmulator(),
  };

  _cameraReady = () => {
    this.setState({ spinner: false });
  };

  async _takePicture() {
    if (!this.state.spinner) {
      this.setState({ spinner: true });

      try {
        const photo = await this.camera.current!.takePictureAsync({
          quality: 0.8,
          base64: true,
          orientation: "portrait",
          fixOrientation: true,
        });
        const photoId = await newCSRUID();

        // PLAT-51: This won't work offline.  But we may not need it to.  More
        // details in the task.
        savePhoto(photoId, photo.base64);

        this.props.dispatch(
          setTestStripImg({
            sample_type: "TestStripBase64",
            code: photoId,
          })
        );
        this.props.dispatch(setRDTPhoto(photo.uri));
        this.setState({ spinner: false });
        this.props.navigation.push("TestStripConfirmation");
      } catch (e) {
        this.setState({ spinner: false });
      }
    }
  }

  render() {
    const { t } = this.props;
    return (
      <Chrome navigation={this.props.navigation}>
        <View style={{ flex: 1, marginBottom: -1 * SYSTEM_PADDING_BOTTOM }}>
          <Spinner visible={this.state.spinner} />
          <Camera
            ref={this.camera}
            style={cameraStyles.camera}
            onCameraReady={this._cameraReady}
          />
          <View style={cameraStyles.overlayContainer}>
            <Text
              center={true}
              content={t("title")}
              style={cameraStyles.overlayText}
            />
            <View style={cameraStyles.innerContainer}>
              <Image
                style={cameraStyles.testStrip}
                source={{ uri: "teststripdetail" }}
              />
              <View style={{ flex: 1, marginLeft: GUTTER }}>
                <Text
                  center={true}
                  content={t("stripHere")}
                  style={cameraStyles.overlayText}
                />
                <View style={cameraStyles.targetBox} />
              </View>
            </View>
            <View style={{ alignItems: "center", alignSelf: "stretch" }}>
              <Text
                center={true}
                content={t("description")}
                style={cameraStyles.overlayText}
              />
              <TouchableOpacity onPress={this._takePicture}>
                <View style={cameraStyles.outerCircle}>
                  <View style={cameraStyles.circle} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Chrome>
    );
  }
}

export const RDTReader = withNamespaces("RDTReader")(RDTReaderScreen);

const imageStyles = StyleSheet.create({
  image: {
    aspectRatio: ASPECT_RATIO,
    height: undefined,
    marginBottom: GUTTER,
    width: "100%",
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
