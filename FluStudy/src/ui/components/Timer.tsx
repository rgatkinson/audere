// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { PushNotification, PushNotificationIOS, View } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { withNavigation } from "react-navigation";
import i18n from "i18next";
import { setPushNotificationState, Action, StoreState } from "../../store";
import PushNotificationModal from "./PushNotificationModal";
import {
  PushNotificationState,
  PushRegistrationError,
} from "audere-lib/feverProtocol";
import { tracker, notificationEvent } from "../../util/tracker";

const SECOND_MS = 1000;

interface TimerState {
  done: boolean;
  remaining: Date | null | undefined;
  showPushModal: boolean;
}

export interface ConfigProps {
  nextScreen: string;
  startTimeConfig: string;
  totalTimeMs: number;
}

export interface TimerProps {
  navigation: NavigationScreenProp<any, any>;
  pushState: PushNotificationState;
  startTimeMs: number;
  dispatch(action: Action): void;
  done(): boolean;
  getRemainingLabel(): string;
  getRemainingTime(): number;
  onFastForward(): void;
  onNext(): void;
}

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

const timerWithConfigProps = (configProps: ConfigProps) => (
  WrappedComponent: any
) => {
  class Timer extends React.Component<TimerProps, TimerState> {
    state = {
      done: false,
      remaining: undefined,
      showPushModal: false,
    };

    constructor(props: TimerProps) {
      super(props);
      this._isDone = this._isDone.bind(this);
      this.getRemainingLabel = this.getRemainingLabel.bind(this);
      this.getRemainingTime = this.getRemainingTime.bind(this);
      this._onFastForward = this._onFastForward.bind(this);
      this._removeNotificationListeners = this._removeNotificationListeners.bind(
        this
      );
    }

    _userInfo = { id: configProps.startTimeConfig };
    _timer: NodeJS.Timeout | undefined;
    _willFocus: any;
    _fastForwardMillis = 0;

    _onFastForward(): void {
      this._fastForwardMillis =
        this.props.startTimeMs +
        configProps.totalTimeMs -
        new Date().getTime() -
        5 * SECOND_MS;
      this._scheduleNotification();
    }

    _getRemaining(): Date | null {
      // @ts-ignore
      const remaining = new Date(null);
      if (this.props.startTimeMs == null) {
        remaining.setMilliseconds(configProps.totalTimeMs);
        return remaining;
      } else {
        const deltaMillis =
          this.props.startTimeMs +
          configProps.totalTimeMs -
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

    _setTimer() {
      if (this.props.navigation.isFocused() && !this.state.done) {
        setTimeout(() => {
          if (this.props.navigation.isFocused() && !this.state.done) {
            const remaining = this._getRemaining();
            this.setState({ remaining, done: remaining === null });
            if (remaining != null) {
              this._setTimer();
            }
          }
        }, 1000);
      }
    }

    getRemainingLabel(): string {
      if (this.state.remaining == null) {
        return "00:00";
      }
      // @ts-ignore
      return this.state.remaining!.toISOString().substr(14, 5);
    }

    getRemainingTime(): number | null {
      if (this.state.remaining == null) {
        return 0;
      } else {
        // @ts-ignore
        return this.state.remaining.getTime();
      }
    }

    _scheduleNotification(): void {
      const remaining = this._getRemaining();
      if (remaining != null) {
        PushNotificationIOS.cancelLocalNotifications(this._userInfo);
        PushNotificationIOS.scheduleLocalNotification({
          fireDate: new Date(Date.now() + remaining.getTime()),
          alertBody: i18n.t(
            "common:notifications:" + configProps.startTimeConfig
          ),
          alertAction: "view",
          userInfo: this._userInfo,
        });
      }
    }

    _registrationEvent = (token: string) => {
      const newPushState = { ...this.props.pushState, token };
      this.props.dispatch(setPushNotificationState(newPushState));
      this._scheduleNotification();
    };

    _registrationErrorEvent = (result: PushRegistrationError) => {
      const newPushState = {
        ...this.props.pushState,
        registrationError: result,
      };
      this.props.dispatch(setPushNotificationState(newPushState));
    };

    componentDidMount() {
      PushNotificationIOS.removeEventListener(
        "register",
        this._registrationEvent
      );
      PushNotificationIOS.addEventListener("register", this._registrationEvent);
      PushNotificationIOS.removeEventListener(
        "registrationError",
        this._registrationErrorEvent
      );
      PushNotificationIOS.addEventListener(
        "registrationError",
        this._registrationErrorEvent
      );

      this._willFocus = this.props.navigation.addListener("willFocus", () =>
        this._setTimer()
      );

      const remaining = this._getRemaining();
      this.setState({ remaining, done: remaining === null });

      if (remaining != null) {
        PushNotificationIOS.removeEventListener(
          "localNotification",
          this._handleNotification
        );
        PushNotificationIOS.addEventListener(
          "localNotification",
          this._handleNotification
        );
      }

      this._scheduleNotification();

      if (this.props.navigation.isFocused() && remaining != null) {
        this._setTimer();

        if (!this.props.pushState.showedSystemPrompt) {
          setTimeout(() => {
            this.setState({ showPushModal: true });
          }, 3000);
        }
      }
    }

    _handleNotification = (notification: PushNotification) => {
      if (
        JSON.stringify(notification.getData()) ===
        JSON.stringify(this._userInfo)
      ) {
        this.props.navigation.push(configProps.nextScreen);
        tracker.logEvent(notificationEvent, {
          appLaunch: false,
          timerConfig: configProps.startTimeConfig,
          message: notification.getMessage(),
          // @ts-ignore
          appStatus: notification.getCategory(),
        });
        this._removeNotificationListeners();
      }
    };

    _removeNotificationListeners = () => {
      PushNotificationIOS.removeEventListener(
        "localNotification",
        this._handleNotification
      );
      PushNotificationIOS.removeEventListener(
        "register",
        this._registrationEvent
      );
      PushNotificationIOS.removeEventListener(
        "registrationError",
        this._registrationErrorEvent
      );
    };

    componentWillUnmount() {
      if (this._willFocus != null) {
        this._willFocus.remove();
        this._willFocus = null;
      }
    }

    _onNo = () => {
      const newPushState = {
        ...this.props.pushState,
        softResponse: false,
      };
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

    _isDone = () => {
      return this.state.done;
    };

    render() {
      return (
        <View style={{ alignSelf: "stretch", flex: 1 }}>
          <PushNotificationModal
            visible={this.state.showPushModal}
            onDismiss={this._onNo}
            onSubmit={this._onYes}
          />
          <WrappedComponent
            {...this.props}
            done={this._isDone}
            getRemainingLabel={this.getRemainingLabel}
            getRemainingTime={this.getRemainingTime}
            onFastForward={this._onFastForward}
            onNext={this._removeNotificationListeners}
          />
        </View>
      );
    }
  }

  const timerWithNavigation = withNavigation(Timer);

  return connect((state: StoreState) => {
    return {
      startTimeMs: state.survey[configProps.startTimeConfig],
      pushState: state.survey.pushState,
    };
  })(timerWithNavigation);
};

export default timerWithConfigProps;
