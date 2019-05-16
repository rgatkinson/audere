// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { TouchableWithoutFeedback, View } from "react-native";

interface Props {
  active: boolean;
  children: any;
  taps: number;
  onMultiTap(): void;
}

const PRESS_DELAY = 500;

export default class MultiTapContainer extends React.Component<Props> {
  _taps: number[] = [];

  _handleTap = () => {
    const { active, taps, onMultiTap } = this.props;
    if (active) {
      const now = Date.now();
      if (this._taps.length == taps) {
        this._taps.shift();
      }
      this._taps.push(now);

      if (this._taps.length == taps && now - this._taps[0] < PRESS_DELAY) {
        onMultiTap();
      }
    }
  };

  render() {
    return (
      <TouchableWithoutFeedback onPress={this._handleTap}>
        <View>{this.props.children}</View>
      </TouchableWithoutFeedback>
    );
  }
}
