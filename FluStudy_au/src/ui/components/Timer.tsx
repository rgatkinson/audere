// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { Fragment } from "react";
import { Platform, PushNotificationIOS, View } from "react-native";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import PushNotification from "react-native-push-notification";
import { setPushNotificationState, Action, StoreState } from "../../store";
import PushNotificationModal from "./PushNotificationModal";
import {
  PushNotificationState,
  PushRegistrationError,
} from "audere-lib/coughProtocol";
import { tracker, notificationEvent } from "../../util/tracker";
import {
  BORDER_RADIUS,
  BUTTON_WIDTH,
  GUTTER,
  SECONDARY_COLOR,
} from "../styles";
import BorderView from "./BorderView";
import ContinueButton from "./ContinueButton";
import Text from "./Text";
import MultiTapContainer from "./MultiTapContainer";

const SECOND_MS = 1000;

interface TimerState {
  remaining: Date | null | undefined;
  showPushModal: boolean;
  startTimeMs: number | null;
}

interface Props {
  isDemo: boolean;
  navigation: NavigationScreenProp<any, any>;
  next: string;
  pushState: PushNotificationState;
  startTimeConfig: string;
  totalTimeMs: number;
  dispatch(action: Action): void;
}

if (Platform.OS === "ios") {
  PushNotificationIOS.getInitialNotification().then(notification => {
    // Executed with non null notification when the app is launched (not from background) with
    // the notification
    if (notification != null) {
      tracker.logEvent(notificationEvent, {
        appLaunch: true,
        message: notification.getMessage(),
      });
    }
  });
}

class Timer extends React.Component<Props & WithNamespaces> {
  state = {
    remaining: undefined,
    showPushModal: false,
    startTimeMs: null,
  };

  _timer: NodeJS.Timeout | undefined;
  _willFocus: any;
  _fastForwardMillis = 0;
  _userInfo = {};

  constructor(props: Props & WithNamespaces) {
    super(props);
    this._userInfo = { id: props.startTimeConfig };
  }

  static getDerivedStateFromProps(
    props: Props & WithNamespaces,
    state: TimerState
  ) {
    // @ts-ignore
    const startTimeMs = props[props.startTimeConfig];
    if (startTimeMs !== state.startTimeMs) {
      return { startTimeMs };
    }
    return null;
  }

  _regEvent = (token: string) => {
    const newPushState = { ...this.props.pushState, token };
    this.props.dispatch(setPushNotificationState(newPushState));
    this._scheduleNotification();
  };

  _regErrorEvent = (registrationError: PushRegistrationError) => {
    const newPushState = { ...this.props.pushState, registrationError };
    this.props.dispatch(setPushNotificationState(newPushState));
  };

  componentDidMount() {
    if (Platform.OS === "ios") {
      PushNotificationIOS.removeEventListener("register", this._regEvent);
      PushNotificationIOS.addEventListener("register", this._regEvent);
      PushNotificationIOS.removeEventListener(
        "registrationError",
        this._regErrorEvent
      );
      PushNotificationIOS.addEventListener(
        "registrationError",
        this._regErrorEvent
      );
    } else {
      const handleNotificationAndroid = this._handleNotificationAndroid;
      PushNotification.configure({
        onNotification: function(notification) {
          handleNotificationAndroid(notification);
        },
        requestPermissions: false,
      });
    }

    this._willFocus = this.props.navigation.addListener("willFocus", () =>
      this._setTimer()
    );

    const remaining = this._getRemaining();
    this.setState({ remaining });

    if (Platform.OS === "ios" && remaining != null) {
      PushNotificationIOS.removeEventListener(
        "localNotification",
        this._handleNotificationIOS
      );
      PushNotificationIOS.addEventListener(
        "localNotification",
        this._handleNotificationIOS
      );
    }

    this._scheduleNotification();

    if (this.props.navigation.isFocused() && remaining != null) {
      this._setTimer();

      if (Platform.OS === "ios" && !this.props.pushState.showedSystemPrompt) {
        setTimeout(() => {
          this.setState({ showPushModal: true });
        }, 3000);
      }
    }
  }

  componentWillUnmount() {
    if (this._willFocus != null) {
      this._willFocus.remove();
      this._willFocus = null;
    }
  }

  _scheduleNotification(): void {
    const { startTimeConfig, t } = this.props;
    const remaining = this._getRemaining();
    if (remaining != null) {
      if (Platform.OS === "ios") {
        PushNotification.cancelLocalNotifications(this._userInfo);
      } else {
        PushNotification.cancelAllLocalNotifications();
      }
      PushNotification.localNotificationSchedule({
        date: new Date(Date.now() + remaining.getTime()),
        title: t("common:notifications:title"),
        message: t("common:notifications:" + startTimeConfig),
        userInfo: this._userInfo,
      });
    }
  }

  _onFastForward(): void {
    if (this.state.startTimeMs != null) {
      const { totalTimeMs } = this.props;
      this._fastForwardMillis =
        this.state.startTimeMs! +
        totalTimeMs -
        new Date().getTime() -
        5 * SECOND_MS;
      this._scheduleNotification();
    }
  }

  _getRemaining(): Date | null {
    const { totalTimeMs } = this.props;
    // @ts-ignore
    const remaining = new Date(null);
    if (this.state.startTimeMs == null) {
      remaining.setMilliseconds(totalTimeMs);
      return remaining;
    } else {
      const deltaMillis =
        this.state.startTimeMs! +
        totalTimeMs -
        new Date().getTime() -
        this._fastForwardMillis;
      if (deltaMillis > 0) {
        remaining.setMilliseconds(deltaMillis);
        return remaining;
      } else {
        return null;
      }
    }
  }

  getRemainingLabel(): string {
    if (this.state.remaining == null) {
      return "00:00";
    }
    // @ts-ignore
    return this.state.remaining!.toISOString().substr(14, 5);
  }

  _setTimer() {
    if (this.props.navigation.isFocused() && this.state.remaining !== null) {
      setTimeout(() => {
        if (
          this.props.navigation.isFocused() &&
          this.state.remaining !== null
        ) {
          const remaining = this._getRemaining();
          this.setState({ remaining });
          if (remaining != null) {
            this._setTimer();
          }
        }
      }, 1000);
    }
  }

  _onNo = () => {
    const newPushState = { ...this.props.pushState, softResponse: false };
    this.props.dispatch(setPushNotificationState(newPushState));
    this.setState({ showPushModal: false });
  };

  _onYes = () => {
    PushNotificationIOS.requestPermissions();
    const newPushState = {
      ...this.props.pushState,
      softResponse: true,
      showedSystemPrompt: true,
    };
    this.props.dispatch(setPushNotificationState(newPushState));
    this.setState({ showPushModal: false });
  };

  _handleNotificationIOS = (notification: any) => {
    const { navigation, next, startTimeConfig } = this.props;
    if (
      JSON.stringify(notification.getData()) ===
        JSON.stringify(this._userInfo) &&
      navigation.isFocused()
    ) {
      navigation.push(next);
      tracker.logEvent(notificationEvent, {
        appLaunch: false,
        timerConfig: startTimeConfig,
        message: notification.getMessage(),
        appStatus: notification.getCategory(),
      });
      this._removeNotificationListeners();
    }
  };

  _handleNotificationAndroid = (notification: any) => {
    const { navigation, next, startTimeConfig } = this.props;
    if (navigation.isFocused()) {
      navigation.push(next);
      tracker.logEvent(notificationEvent, {
        appLaunch: false,
        timerConfig: startTimeConfig,
        message: notification.message,
      });
    }
  };

  _removeNotificationListeners = () => {
    if (Platform.OS === "ios") {
      PushNotificationIOS.removeEventListener(
        "localNotification",
        this._handleNotificationIOS
      );
      PushNotificationIOS.removeEventListener("register", this._regEvent);
      PushNotificationIOS.removeEventListener(
        "registrationError",
        this._regErrorEvent
      );
    }
  };

  render() {
    const { isDemo, next, t } = this.props;
    return this.state.remaining === null ? (
      <ContinueButton next={next} />
    ) : (
      <Fragment>
        <PushNotificationModal
          visible={this.state.showPushModal}
          onDismiss={this._onNo}
          onSubmit={this._onYes}
        />
        <MultiTapContainer
          active={isDemo}
          taps={3}
          onMultiTap={() => this._onFastForward()}
        >
          <BorderView
            style={{
              alignSelf: "center",
              borderRadius: BORDER_RADIUS,
              marginBottom: GUTTER * 2,
              width: BUTTON_WIDTH,
            }}
          >
            <Text
              bold={true}
              content={this.getRemainingLabel()}
              style={{ color: SECONDARY_COLOR }}
            />
          </BorderView>
        </MultiTapContainer>
      </Fragment>
    );
  }
}

export default connect((state: StoreState) => ({
  isDemo: state.meta.isDemo,
  oneMinuteStartTime: state.survey.oneMinuteStartTime,
  tenMinuteStartTime: state.survey.tenMinuteStartTime,
  pushState: state.survey.pushState,
}))(withNavigation(withNamespaces()(Timer)));
