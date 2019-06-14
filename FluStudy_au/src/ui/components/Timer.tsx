// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { StoreState } from "../../store";
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
  startTimeMs: number | null;
}

interface Props {
  isDemo: boolean;
  navigation: NavigationScreenProp<any, any>;
  next: string;
  startTimeConfig: string;
  totalTimeMs: number;
}

class Timer extends React.Component<Props & WithNamespaces> {
  state = {
    remaining: undefined,
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

  componentDidMount() {
    this._willFocus = this.props.navigation.addListener("willFocus", () =>
      this._setTimer()
    );

    const remaining = this._getRemaining();
    this.setState({ remaining });

    if (this.props.navigation.isFocused() && remaining != null) {
      this._setTimer();
    }
  }

  componentWillUnmount() {
    if (this._willFocus != null) {
      this._willFocus.remove();
      this._willFocus = null;
    }
  }

  _onFastForward = () => {
    if (this.state.startTimeMs != null) {
      const { totalTimeMs } = this.props;
      this._fastForwardMillis =
        this.state.startTimeMs! +
        totalTimeMs -
        new Date().getTime() -
        5 * SECOND_MS;
    }
  };

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

  render() {
    const { isDemo, next, t } = this.props;
    return this.state.remaining === null ? (
      <ContinueButton next={next} />
    ) : (
      <MultiTapContainer
        active={isDemo}
        taps={3}
        onMultiTap={this._onFastForward}
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
    );
  }
}

export default connect((state: StoreState) => ({
  isDemo: state.meta.isDemo,
  oneMinuteStartTime: state.survey.oneMinuteStartTime,
  tenMinuteStartTime: state.survey.tenMinuteStartTime,
}))(withNavigation(withNamespaces()(Timer)));
