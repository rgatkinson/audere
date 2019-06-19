// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { StoreState } from "../../store";
import Text from "./Text";
import strings from "../../i18n/locales/en.json";

const DID_YOU_KNOW_TEXTS = strings.didYouKnow;
const NUM_TEXTS = DID_YOU_KNOW_TEXTS.length;

interface State {
  currentTextNum: number | null | undefined;
}

interface Props {
  navigation: NavigationScreenProp<any, any>;
  startTimeConfig: string;
  startTimeMs: number;
  msPerItem: number;
}

class DidYouKnow extends React.Component<Props & WithNamespaces> {
  state = {};

  _timer: NodeJS.Timeout | undefined;
  _willFocus: any;
  currentText: string;

  constructor(props: Props & WithNamespaces) {
    super(props);
    this.currentText = DID_YOU_KNOW_TEXTS[this._getCurrentTextNum()];
  }

  shouldComponentUpdate(props: Props & WithNamespaces, state: State) {
    return state != this.state;
  }

  componentDidMount() {
    this._willFocus = this.props.navigation.addListener("willFocus", () =>
      this._startCycle()
    );
    this._startCycle();
  }

  componentWillUnmount() {
    if (this._willFocus != null) {
      this._willFocus.remove();
      this._willFocus = null;
    }
  }

  _getCurrentTextNum(): number {
    const { startTimeMs, msPerItem } = this.props;
    return Math.floor(
      ((new Date().getTime() - startTimeMs) / msPerItem) % NUM_TEXTS
    );
  }

  _startCycle = () => {
    if (this.props.navigation.isFocused()) {
      const currentTextNum = this._getCurrentTextNum();
      const currentText = DID_YOU_KNOW_TEXTS[currentTextNum];
      this.setState({ currentTextNum });
      if (currentText != null) {
        this._setTimer();
      }
    }
  };

  _setTimer = () => {
    if (this._timer == null) {
      const { msPerItem } = this.props;
      this._timer = setTimeout(() => {
        this._timer = undefined;
        if (this.props.navigation.isFocused()) {
          const currentTextNum = this._getCurrentTextNum();
          this.currentText = DID_YOU_KNOW_TEXTS[currentTextNum];
          this.setState({ currentTextNum });
          this._setTimer();
        }
      }, msPerItem);
    }
  };

  render() {
    return <Text content={this.currentText} />;
  }
}

export default connect((state: StoreState, props: Props & WithNamespaces) => ({
  startTimeMs: state.survey[props.startTimeConfig],
}))(withNavigation(withNamespaces()(DidYouKnow)));
