// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { PushNotificationIOS, View } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { setPushNotificationState, Action, StoreState } from "../../store";
import PushNotificationModal from "./PushNotificationModal";
import {
  PushNotificationState,
  PushRegistrationError,
} from "audere-lib/feverProtocol";

const SECOND_MS = 1000;

interface TimerState {
  done: boolean;
  remaining: Date | null | undefined;
  showPushModal: boolean;
}

export interface ConfigProps {
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
}

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
    }

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
        PushNotificationIOS.cancelAllLocalNotifications();
        PushNotificationIOS.scheduleLocalNotification({
          fireDate: new Date(Date.now() + remaining.getTime()),
          alertBody:
            configProps.startTimeConfig === "oneMinuteStartTime"
              ? "Timer is complete! Come back to the app and remove your swab from the tube."
              : "Timer is complete! Return to the app and remove your test strip from the tube.",
          alertAction: "view",
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
      PushNotificationIOS.addEventListener("register", this._registrationEvent);
      PushNotificationIOS.addEventListener(
        "registrationError",
        this._registrationErrorEvent
      );

      const remaining = this._getRemaining();
      this.setState({ remaining, done: remaining === null });
      this._willFocus = this.props.navigation.addListener("willFocus", () =>
        this._setTimer()
      );
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

    componentWillUnmount() {
      PushNotificationIOS.removeEventListener(
        "register",
        this._registrationEvent
      );

      PushNotificationIOS.removeEventListener(
        "registrationError",
        this._registrationErrorEvent
      );

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
          />
        </View>
      );
    }
  }

  return connect((state: StoreState) => {
    return {
      startTimeMs: state.survey[configProps.startTimeConfig],
      pushState: state.survey.pushState,
    };
  })(Timer);
};

export default timerWithConfigProps;
