// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StatusBar } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

interface Props {
  children: any;
}

export default class ScreenContainer extends React.Component<Props> {
  render() {
    return (
      <KeyboardAwareScrollView resetScrollToCoords={{ x: 0, y: 0 }}>
        <StatusBar barStyle="dark-content" />
        {this.props.children}
      </KeyboardAwareScrollView>
    );
  }
}
