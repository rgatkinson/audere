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
const SECONDS_MINUTE = 60;
const MINUTE_MS = SECONDS_MINUTE * SECOND_MS;
const FAST_FORWARD_MS = 5 * SECOND_MS;

interface State {
  remainingMs: number | null | undefined;
}

interface Props {
  isDemo: boolean;
  navigation: NavigationScreenProp<any, any>;
  next: string;
  startTimeConfig: string;
  startTimeMs: number;
  totalTimeMs: number;
}

class Timer extends React.Component<Props & WithNamespaces> {
  state = {
    remainingMs: undefined,
  };

  _timer: NodeJS.Timeout | undefined;
  _willFocus: any;

  shouldComponentUpdate(props: Props & WithNamespaces, state: State) {
    return (
      state != this.state ||
      props.isDemo != this.props.isDemo ||
      props.startTimeMs != this.props.startTimeMs ||
      props.totalTimeMs != this.props.totalTimeMs
    );
  }

  componentDidMount() {
    this._willFocus = this.props.navigation.addListener("willFocus", () =>
      this._startClock()
    );

    this._startClock();
  }

  componentWillUnmount() {
    if (this._willFocus != null) {
      this._willFocus.remove();
      this._willFocus = null;
    }
  }

  _onFastForward = () => {
    this.setState({ remainingMs: FAST_FORWARD_MS });
  };

  _getRemainingMs(): number | null {
    const { startTimeMs, totalTimeMs } = this.props;
    const deltaMillis = startTimeMs + totalTimeMs - new Date().getTime();
    return deltaMillis > SECOND_MS ? deltaMillis : null;
  }

  _getRemainingLabel = (): string => {
    const { remainingMs } = this.state;
    if (remainingMs == null) {
      return "00:00";
    }

    const minutes = Math.floor(remainingMs / MINUTE_MS).toString();
    const seconds = (Math.floor(remainingMs % MINUTE_MS) / SECOND_MS).toFixed();

    // @ts-ignore
    return `${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
  };

  _startClock = () => {
    if (this.props.navigation.isFocused()) {
      const remainingMs = this._getRemainingMs();
      this.setState({ remainingMs });
      if (remainingMs != null) {
        this._setTimer();
      }
    }
  };

  _setTimer = () => {
    if (this._timer == null) {
      this._timer = setTimeout(() => {
        this._timer = undefined;
        if (this.props.navigation.isFocused()) {
          if (this.state.remainingMs != null) {
            const remainingMs = this.state.remainingMs! - SECOND_MS;
            if (remainingMs < SECOND_MS) {
              this.setState({ remainingMs: null });
            } else {
              this.setState({ remainingMs });
              this._setTimer();
            }
          }
        }
      }, SECOND_MS);
    }
  };

  render() {
    const { isDemo, next, t } = this.props;
    return this.state.remainingMs === null ? (
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
