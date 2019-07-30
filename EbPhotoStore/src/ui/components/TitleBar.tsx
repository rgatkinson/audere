// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  GestureResponderEvent,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { toggleDemoMode, Action, StoreState } from "../../store";
import MultiTapContainer from "./MultiTapContainer";
import Text from "./Text";
import {
  GUTTER,
  LARGE_TEXT,
  NAV_BAR_HEIGHT,
  REGULAR_TEXT,
  SYSTEM_FONT,
  STATUS_BAR_HEIGHT
} from "../styles";

interface Props {
  demoMode: boolean;
  dispatch(action: Action): void;
  onBack?(event: GestureResponderEvent): void;
}

class TitleBar extends React.Component<Props & WithNamespaces> {
  _toggleDemoMode = () => {
    this.props.dispatch(toggleDemoMode());
  };

  render() {
    const { demoMode, onBack, t } = this.props;
    return (
      <MultiTapContainer
        active={true}
        style={styles.container}
        taps={4}
        onMultiTap={this._toggleDemoMode}
      >
        {demoMode && <View style={styles.demoView} />}
        {!!onBack ? (
          <TouchableOpacity style={styles.actionContainer} onPress={onBack}>
            <Text style={styles.actionContent} content={t("back")} />
          </TouchableOpacity>
        ) : (
          <View style={styles.actionContainer} />
        )}
        <Text style={styles.title} content={t("title")} />
        <View style={styles.actionContainer} />
      </MultiTapContainer>
    );
  }
}

export default connect((state: StoreState) => ({
  demoMode: state.meta.demoMode
}))(withNamespaces("titleBar")(TitleBar));

const styles = StyleSheet.create({
  demoView: {
    backgroundColor: "rgba(1, 128, 1, 0.5)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT
  },
  container: {
    alignItems: "center",
    flexDirection: "row",
    height: NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: GUTTER / 2
  },
  title: {
    color: "white",
    fontFamily: SYSTEM_FONT,
    fontSize: LARGE_TEXT,
    fontWeight: "bold",
    paddingTop: STATUS_BAR_HEIGHT
  },
  actionContainer: {
    alignItems: "center",
    flexDirection: "row",
    width: 80
  },
  actionContent: {
    color: "white",
    fontSize: REGULAR_TEXT,
    textAlign: "center",
    paddingHorizontal: GUTTER / 2,
    paddingTop: STATUS_BAR_HEIGHT
  }
});
