// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { AppState } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import BackgroundTimer from "react-native-background-timer";
import Sound from "react-native-sound";
import { StoreState } from "../../store";

const SECOND_MS = 1000;

interface TimerState {
  appState: string;
  done: boolean;
  paused: boolean;
  remaining: Date | null | undefined;
}

export interface ConfigProps {
  startTimeConfig: string;
  totalTimeMs: number;
}

export interface TimerProps {
  startTimeMs: number;
  navigation: NavigationScreenProp<any, any>;
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
      appState: "active",
      done: false,
      paused: true,
      remaining: undefined,
    };

    constructor(props: TimerProps) {
      super(props);
      this.getRemainingLabel = this.getRemainingLabel.bind(this);
      this.getRemainingTime = this.getRemainingTime.bind(this);
      this._onFastForward = this._onFastForward.bind(this);
    }

    _audioTimer: number | null = null;
    _sound: any;
    _timer: NodeJS.Timeout | undefined;
    _didBlur: any;
    _willFocus: any;
    _fastForwardMillis = 0;

    _onFastForward(): void {
      this._fastForwardMillis =
        this.props.startTimeMs +
        configProps.totalTimeMs -
        new Date().getTime() -
        5 * SECOND_MS;

      this._setAudioTimer();
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

    _clearAudioTimer() {
      if (this._audioTimer != null) {
        BackgroundTimer.clearTimeout(this._audioTimer);
        this._audioTimer = null;
      }
    }

    _setAudioTimer() {
      this._clearAudioTimer();
      const remaining = this._getRemaining();
      if (remaining != null) {
        if (this._sound == null) {
          this._sound = new Sound(
            require("../../../assets/sounds/Popcorn.caf"),
            error => {}
          );
          this._sound.setNumberOfLoops(0);
        }
        this._audioTimer = BackgroundTimer.setTimeout(() => {
          if (this.state.appState != "active") {
            Sound.setCategory("Playback", true);
          } else {
            Sound.setCategory("SoloAmbient", true);
          }

          if (this._sound != null && this._sound.isLoaded()) {
            try {
              this._sound.play();
            } catch (error) {}
          }
        }, remaining.getTime());
      }
    }

    getRemainingLabel(): string {
      if (this.state.remaining == null) {
        return "00:00";
      }
      // @ts-ignore
      return this.state.remaining!.toISOString().substr(14, 5);
    }

    getRemainingTime(): Date | null {
      // @ts-ignore
      return this.state.remaining == null ? 0 : this.state.remaining!.getTime();
    }

    componentDidMount() {
      const remaining = this._getRemaining();
      this.setState({ remaining, done: remaining == null });
      AppState.addEventListener("change", this._handleAppStateChange);
      this._willFocus = this.props.navigation.addListener("willFocus", () => {
        this._setTimer();
        this._setAudioTimer();
      });

      this._didBlur = this.props.navigation.addListener("didBlur", () => {
        this._clearAudioTimer();
      });

      if (this.props.navigation.isFocused() && remaining != null) {
        this._setTimer();
        this._setAudioTimer();
      }
    }

    componentWillUnmount() {
      if (this._willFocus != null) {
        this._willFocus.remove();
        this._willFocus = null;
      }

      if (this._didBlur != null) {
        this._didBlur.remove();
        this._didBlur = null;
      }
      AppState.removeEventListener("change", this._handleAppStateChange);
    }

    _handleAppStateChange = (nextAppState: string) => {
      if (nextAppState != this.state.appState) {
        this.setState({ appState: nextAppState });
      }
    };

    _isDone = () => {
      return this.state.done;
    };

    render() {
      return (
        <WrappedComponent
          {...this.props}
          done={this._isDone}
          getRemainingLabel={this.getRemainingLabel}
          getRemainingTime={this.getRemainingTime}
          onFastForward={this._onFastForward}
        />
      );
    }
  }

  return connect((state: StoreState) => {
    return {
      startTimeMs: state.survey[configProps.startTimeConfig],
    };
  })(Timer);
};
export default timerWithConfigProps;
