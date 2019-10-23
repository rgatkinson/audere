// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { Fragment } from "react";
import { StyleSheet, View } from "react-native";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { Action, StoreState } from "../../store";
import { GUTTER, LARGE_TEXT, PRIMARY_COLOR } from "../styles";
import ProgressCircle from "react-native-progress-circle";
import Text from "./Text";
import MultiTapContainer from "./MultiTapContainer";

const SECOND_MS = 1000;
const SECONDS_MINUTE = 60;
const MINUTE_MS = SECONDS_MINUTE * SECOND_MS;
const FAST_FORWARD_MS = 5 * SECOND_MS;

const OUTER_DIAMETER = 150;
const INNER_DIAMETER = 140;
const RING_DIAMETER = 100;
const RING_THICKNESS = 4;
const MARKER_DIAMETER = 8;

interface State {
  remainingLabel: string;
}

interface Props {
  isDemo: boolean;
  navigation: NavigationScreenProp<any, any>;
  startTimeConfig: string;
  startTimeMs: number;
  totalTimeMs: number;
  dispatch(action: Action): void;
  dispatchOnDone?: () => Action;
}

class TimerRing extends React.Component<Props & WithNamespaces> {
  state = {
    remainingLabel: "",
  };

  _timer: NodeJS.Timeout | undefined;
  _willFocus: any;
  _willBlur: any;
  _startTimeMs: number = 0;

  shouldComponentUpdate(props: Props & WithNamespaces, state: State) {
    return (
      state.remainingLabel !== this.state.remainingLabel ||
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
    this._startClock();
  };

  _getRemainingMs(): number | null {
    const { totalTimeMs } = this.props;
    const deltaMillis = this._startTimeMs + totalTimeMs - new Date().getTime();
    return deltaMillis >= SECOND_MS ? deltaMillis : null;
  }

  _getRemainingLabel(): string {
    const remainingMs = this._getRemainingMs();
    if (!remainingMs) {
      return "00:00";
    }

    const minutes = Math.floor(remainingMs / MINUTE_MS).toString();
    const seconds = Math.floor((remainingMs % MINUTE_MS) / SECOND_MS).toFixed();

    // @ts-ignore
    return `${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
  }

  _getRemainingPercent = () => {
    const remainingMs = this._getRemainingMs();
    if (!remainingMs) {
      return 0;
    }
    return (
      ((Math.floor(remainingMs / SECOND_MS) * SECOND_MS) /
        this.props.totalTimeMs) *
      100
    );
  };

  _startClock = () => {
    this._clearClock();
    if (this.props.navigation.isFocused()) {
      this.setState({ remainingLabel: this._getRemainingLabel() });
      if (this._getRemainingMs()) {
        this._timer = global.setInterval(this._onTimer, SECOND_MS);
      } else {
        this._timerDone();
      }
    }
  };

  _onTimer = () => {
    if (this.props.navigation.isFocused()) {
      const isDone = !this._getRemainingMs();
      this.setState({ remainingLabel: this._getRemainingLabel() });
      if (isDone) {
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
    const { isDemo, t } = this.props;
    const remainingPct = this._getRemainingPercent();
    const angle = (remainingPct / 100) * 360;
    return (
      <MultiTapContainer
        active={isDemo}
        taps={3}
        onMultiTap={this._onFastForward}
        style={styles.container}
      >
        <View style={styles.outerCircle}>
          <View style={styles.innerCircle}>
            {remainingPct > 0 ? (
              <Fragment>
                <ProgressCircle
                  percent={remainingPct}
                  radius={RING_DIAMETER / 2}
                  borderWidth={RING_THICKNESS}
                  color={PRIMARY_COLOR}
                  shadowColor="white"
                  bgColor="#bfc3e0"
                />
                <View
                  style={[
                    styles.markerContainer,
                    { transform: [{ rotate: angle + "deg" }] },
                  ]}
                >
                  <View style={styles.marker} />
                </View>
              </Fragment>
            ) : null}
          </View>
        </View>
        <View style={styles.textContainer}>
          <Text
            content={
              remainingPct > 0
                ? this.state.remainingLabel
                : t("common:timer:timerDone")
            }
            style={styles.text}
          />
        </View>
      </MultiTapContainer>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: OUTER_DIAMETER,
    marginTop: GUTTER,
    marginBottom: GUTTER / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  outerCircle: {
    borderColor: "#dadff3",
    borderWidth: OUTER_DIAMETER / 2,
    borderRadius: OUTER_DIAMETER / 2,
    height: OUTER_DIAMETER,
    width: OUTER_DIAMETER,
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    borderColor: "#bfc3e0",
    borderWidth: INNER_DIAMETER / 2,
    borderRadius: INNER_DIAMETER / 2,
    height: INNER_DIAMETER,
    width: INNER_DIAMETER,
    alignItems: "center",
    justifyContent: "center",
  },
  markerContainer: {
    width: RING_DIAMETER + MARKER_DIAMETER / 2,
    height: RING_DIAMETER + MARKER_DIAMETER / 2,
    position: "absolute",
  },
  marker: {
    borderColor: PRIMARY_COLOR,
    borderWidth: MARKER_DIAMETER / 2,
    borderRadius: MARKER_DIAMETER / 2,
    height: MARKER_DIAMETER,
    width: MARKER_DIAMETER,
    top: 0,
    left: (RING_DIAMETER - MARKER_DIAMETER / 2) / 2,
    position: "absolute",
  },
  textContainer: {
    width: "100%",
    height: "100%",
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: PRIMARY_COLOR,
    fontSize: LARGE_TEXT,
  },
});

export default connect((state: StoreState, props: Props & WithNamespaces) => ({
  isDemo: state.meta.isDemo,
  startTimeMs: state.survey[props.startTimeConfig],
}))(withNavigation(withNamespaces()(TimerRing)));
