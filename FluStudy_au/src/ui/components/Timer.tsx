// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { Action, StoreState } from "../../store";
import {
  BORDER_RADIUS,
  BUTTON_WIDTH,
  GUTTER,
  SECONDARY_COLOR,
  INPUT_HEIGHT,
} from "../styles";
import BorderView from "./BorderView";
import ContinueButton from "./ContinueButton";
import Text from "./Text";
import MultiTapContainer from "./MultiTapContainer";

const SECOND_MS = 1000;
const SECONDS_MINUTE = 60;
const MINUTE_MS = SECONDS_MINUTE * SECOND_MS;
const FAST_FORWARD_MS = 5 * SECOND_MS;

interface State {
  remainingLabel: string;
}

interface Props {
  isDemo: boolean;
  navigation: NavigationScreenProp<any, any>;
  next: string;
  startTimeConfig: string;
  startTimeMs: number;
  totalTimeMs: number;
  dispatch(action: Action): void;
  dispatchOnDone?: () => Action;
}

class Timer extends React.Component<Props & WithNamespaces> {
  state = {
    remainingLabel: this._getRemainingLabel(),
  };

  _timer: NodeJS.Timeout | undefined;
  _willFocus: any;
  _willBlur: any;
  _startTimeMs: number = 0;

  shouldComponentUpdate(props: Props & WithNamespaces, state: State) {
    return (
      state != this.state ||
      props.isDemo != this.props.isDemo ||
      props.startTimeMs != this.props.startTimeMs ||
      props.totalTimeMs != this.props.totalTimeMs
    );
  }

  componentDidMount() {
    this._startTimeMs = this.props.startTimeMs;
    this._willFocus = this.props.navigation.addListener("willFocus", () => {
      this._startClock();
    });
    this._willBlur = this.props.navigation.addListener(
      "willBlur",
      this._clearClock
    );

    this._startClock();
  }

  componentWillUnmount() {
    if (this._willFocus != null) {
      this._willFocus.remove();
      this._willFocus = null;
    }
    if (this._willBlur != null) {
      this._willBlur.remove();
      this._willBlur = null;
    }
    this._clearClock();
  }

  _clearClock = () => {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = undefined;
    }
  };

  _onFastForward = () => {
    // Just pretend we started 5 secs before the original target end time.
    this._startTimeMs =
      new Date().getTime() - this.props.totalTimeMs + FAST_FORWARD_MS;
    this.setState({
      remainingLabel: this._getRemainingLabel(),
    });
  };

  _getRemainingMs(): number | null {
    const { totalTimeMs } = this.props;
    const deltaMillis = this._startTimeMs + totalTimeMs - new Date().getTime();
    return deltaMillis > SECOND_MS ? deltaMillis : null;
  }

  _getRemainingLabel(): string {
    const remainingMs = this._getRemainingMs();
    if (remainingMs == null) {
      return "00:00";
    }

    const minutes = Math.floor(remainingMs / MINUTE_MS).toString();
    const seconds = Math.floor((remainingMs % MINUTE_MS) / SECOND_MS).toFixed();

    // @ts-ignore
    return `${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
  }

  _startClock = () => {
    this._clearClock();
    if (this.props.navigation.isFocused()) {
      this.setState({ remainingLabel: this._getRemainingLabel() });
      if (this._getRemainingMs()) {
        this._timer = setInterval(this._onTimer, SECOND_MS);
      } else {
        this._timerDone();
      }
    }
  };

  _onTimer = () => {
    if (this.props.navigation.isFocused()) {
      this.setState({ remainingLabel: this._getRemainingLabel() });
      if (!this._getRemainingMs()) {
        this._timerDone();
      }
    }
  };

  _timerDone() {
    const { dispatch, dispatchOnDone } = this.props;
    this._clearClock();
    dispatchOnDone && dispatch(dispatchOnDone());
  }

  render() {
    const { isDemo, next } = this.props;
    return this._getRemainingMs() === null ? (
      <ContinueButton next={next} />
    ) : (
      <MultiTapContainer
        active={isDemo}
        taps={3}
        onMultiTap={this._onFastForward}
      >
        <BorderView
          style={{
            alignItems: "center",
            alignSelf: "center",
            borderRadius: BORDER_RADIUS,
            height: INPUT_HEIGHT,
            justifyContent: "center",
            marginBottom: GUTTER * 2,
            width: BUTTON_WIDTH,
          }}
        >
          <Text
            bold={true}
            content={this._getRemainingLabel()}
            style={{ color: SECONDARY_COLOR }}
          />
        </BorderView>
      </MultiTapContainer>
    );
  }
}

export default connect((state: StoreState, props: Props & WithNamespaces) => ({
  isDemo: state.meta.isDemo,
  startTimeMs: state.survey[props.startTimeConfig],
}))(withNavigation(withNamespaces()(Timer)));
