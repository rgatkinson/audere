// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  GestureResponderEvent,
  Image,
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
  STATUS_BAR_HEIGHT,
  TITLE_IMAGE,
  TITLEBAR_TEXT_COLOR
} from "../styles";

interface Props {
  demoMode: boolean;
  dispatch(action: Action): void;
  onBack?(event: GestureResponderEvent): void;
  onMenu?(event: GestureResponderEvent): void;
}

class TitleBar extends React.Component<Props & WithNamespaces> {
  _toggleDemoMode = () => {
    this.props.dispatch(toggleDemoMode());
  };

  render() {
    const { demoMode, onBack, onMenu, t } = this.props;
    return (
      <MultiTapContainer
        active={true}
        style={styles.barContainer}
        taps={4}
        onMultiTap={this._toggleDemoMode}
      >
        {demoMode && <View style={styles.demoView} />}
        <View style={styles.titleContainer}>
          {!!onBack ? (
            <TouchableOpacity style={styles.actionContainer} onPress={onBack}>
              <Text style={styles.actionContent} content={t("back")} />
            </TouchableOpacity>
          ) : (
            <View style={styles.actionContainer} />
          )}
          <Image source={TITLE_IMAGE} style={styles.titleImage} />
          <TouchableOpacity style={styles.actionContainer} onPress={onMenu}>
            <Text
              style={[
                styles.actionContent,
                { textAlign: "right", fontSize: LARGE_TEXT, fontWeight: "bold" }
              ]}
              content="&#9776;"
            />
          </TouchableOpacity>
        </View>
      </MultiTapContainer>
    );
  }
}

export default connect((state: StoreState) => ({
  demoMode: state.meta.demoMode
}))(withNamespaces("titleBar")(TitleBar));

const styles = StyleSheet.create({
  barContainer: {
    height: NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT
  },
  demoView: {
    backgroundColor: "rgba(1, 128, 1, 0.5)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT
  },
  titleContainer: {
    marginTop: STATUS_BAR_HEIGHT,
    marginBottom: GUTTER / 2,
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between"
  },
  actionContainer: {
    width: 80
  },
  actionContent: {
    color: TITLEBAR_TEXT_COLOR,
    fontSize: REGULAR_TEXT,
    marginHorizontal: GUTTER / 2
  },
  titleImage: {
    aspectRatio: 112 / 23,
    width: 140
  }
});
