// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { connect } from "react-redux";
import { toggleDemoMode, Action, StoreState } from "../../store";
import MultiTapContainer from "./MultiTapContainer";
import Text from "./Text";
import { GUTTER, NAV_BAR_HEIGHT, SYSTEM_FONT, SYSTEM_TEXT } from "../styles";

interface Props {
  demoMode: boolean;
  dispatch(action: Action): void;
}

class NavigationBar extends React.Component<Props> {
  _toggleDemoMode = () => {
    this.props.dispatch(toggleDemoMode());
  };

  render() {
    const { demoMode } = this.props;
    return (
      <MultiTapContainer
        active={true}
        style={styles.container}
        taps={4}
        onMultiTap={this._toggleDemoMode}
      >
        {demoMode && <View style={styles.demoView} />}
        <Text style={styles.title} content={"EbPhotoStore"} />
      </MultiTapContainer>
    );
  }
}

export default connect((state: StoreState) => ({
  demoMode: state.meta.demoMode
}))(NavigationBar);

const styles = StyleSheet.create({
  demoView: {
    backgroundColor: "rgba(1, 128, 1, 0.5)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: NAV_BAR_HEIGHT
  },
  container: {
    alignItems: "center",
    height: NAV_BAR_HEIGHT,
    justifyContent: "center",
    paddingHorizontal: GUTTER / 2
  },
  title: {
    color: "black",
    fontFamily: SYSTEM_FONT,
    fontSize: SYSTEM_TEXT,
    fontWeight: "bold"
  }
});
