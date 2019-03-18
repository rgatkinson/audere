// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { StoreState } from "../../store";

const SECOND_MS = 1000;

interface TimerState {
  done: boolean;
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
      done: false,
      remaining: undefined,
    };

    _timer: NodeJS.Timeout | undefined;
    _willFocus: any;
    _fastForwardMillis = 0;

    _onFastForward(): void {
      this._fastForwardMillis =
        this.props.startTimeMs +
        configProps.totalTimeMs -
        new Date().getTime() -
        5 * SECOND_MS;
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
            this._setTimer();
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

    getRemainingTime(): Date | null {
      // @ts-ignore
      return this.state.remaining == null ? 0 : this.state.remaining!.getTime();
    }

    componentDidMount() {
      this.setState({ remaining: this._getRemaining() });
      this._setTimer();
      this._willFocus = this.props.navigation.addListener("willFocus", () =>
        this._setTimer()
      );
    }

    componentWillUnmount() {
      if (this._willFocus != null) {
        this._willFocus.remove();
        this._willFocus = null;
      }
    }

    render() {
      return (
        <WrappedComponent
          {...this.props}
          done={() => this.state.done}
          getRemainingLabel={() => this.getRemainingLabel()}
          getRemainingTime={() => this.getRemainingTime()}
          onFastForward={() => this._onFastForward()}
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
