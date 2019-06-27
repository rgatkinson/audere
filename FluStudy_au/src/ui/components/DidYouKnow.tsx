// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet, View } from "react-native";
import { REGULAR_TEXT } from "../styles";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { StoreState } from "../../store";
import Text from "./Text";

const TIPS = [ "tip0", "tip1", "tip2", "tip3", "tip4", "tip5", "tip6", "tip7", "tip8", "tip9", "tip10", "tip11", "tip12" ];
const SOURCES = [ "source0", "source1", "source2", "source3", "source4", "source5", "source6", "source7", "source8", "source9", "source10", "source11", "source12", "source13" ];

// This component will render up to this number of tips
const TIP_COUNT = 8;
// This acts as a multiplier for the source part of the text's size relative to the tip itself
const SOURCE_SIZE = 0.8;
const SOURCE_LINE_HEIGHT = 16;

interface State {
  currentText: string | null | undefined;
  currentSource: string | null | undefined;
}

interface Props {
  navigation: NavigationScreenProp<any, any>;
  startTimeConfig: string;
  startTimeMs: number;
  msPerItem: number;
}

class DidYouKnow extends React.Component<Props & WithNamespaces> {
  state = {
    currentText: "",
    currentSource: "",
  };

  _timer: NodeJS.Timeout | undefined;
  _willFocus: any;

  componentDidMount() {
    this._showNextTip();
    this._setTimer();
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
      ((new Date().getTime() - startTimeMs) / msPerItem) % TIP_COUNT
    );
  }

  _showNextTip = () => {
    if (this.props.navigation.isFocused()) {
      const { t } = this.props;
      const currentTextNum = this._getCurrentTextNum();
      const currentText = t("didYouKnow:" + TIPS[currentTextNum]);
      const currentSource = t("didYouKnow:" + SOURCES[currentTextNum]);
      this.setState({ currentText, currentSource });
    }
  };

  _setTimer = () => {
    if (!this._timer && this.props.navigation.isFocused()) {
      const { msPerItem } = this.props;
      this._timer = setTimeout(() => {
        this._timer = undefined;
        this._showNextTip();
        this._setTimer();
      }, msPerItem);
    }
  };

  render() {
    return (
      <View>
        <Text content={this.state.currentText} />
        <Text style={styles.source} content={this.state.currentSource} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  source: {
    fontSize: REGULAR_TEXT * SOURCE_SIZE,
    lineHeight: SOURCE_LINE_HEIGHT,
  },
});

export default connect((state: StoreState, props: Props & WithNamespaces) => ({
  startTimeMs: state.survey[props.startTimeConfig],
}))(withNavigation(withNamespaces()(DidYouKnow)));
