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
  View,
} from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { toggleDemoMode, Action, StoreState } from "../../store";
import MultiTapContainer from "./MultiTapContainer";
import Text from "./Text";
import {
  DEMO_MODE_COLOR,
  GUTTER,
  LARGE_TEXT,
  NAV_BAR_HEIGHT,
  REGULAR_TEXT,
  STATUS_BAR_HEIGHT,
  TITLE_IMAGE,
  TITLEBAR_TEXT_COLOR,
} from "../styles";
import { hasPendingPhotos } from "../../transport/photoUploader";

interface Props {
  demoMode: boolean;
  dispatch(action: Action): void;
  onBack?(event: GestureResponderEvent): void;
  hasPendingPhoto: boolean;
  backText?: string;
  onMenu?(event: GestureResponderEvent): void;
}

class TitleBar extends React.Component<Props & WithNamespaces> {
  _toggleDemoMode = () => {
    this.props.dispatch(toggleDemoMode());
  };

  render() {
    const {
      backText,
      demoMode,
      onBack,
      onMenu,
      hasPendingPhoto,
      t,
    } = this.props;

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
            <TouchableOpacity style={styles.backContainer} onPress={onBack}>
              <Text
                style={styles.actionContent}
                content={t("backFull", { back: t(backText || "back") })}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.backContainer} />
          )}
          <Image source={TITLE_IMAGE} style={styles.titleImage} />
          <View style={styles.iconContainer}>
            <Image
              style={styles.pendingIcon}
              source={{
                uri: !!hasPendingPhoto ? "datauploading" : "datauploaded",
              }}
            />
            <TouchableOpacity
              style={styles.hamburgerContainer}
              onPress={onMenu}
            >
              <Text
                style={[styles.actionContent, styles.hamburgerIcon]}
                content="&#9776;"
              />
            </TouchableOpacity>
          </View>
        </View>
      </MultiTapContainer>
    );
  }
}

export default connect((state: StoreState) => ({
  demoMode: state.meta.demoMode,
  hasPendingPhoto: hasPendingPhotos(state),
}))(withNamespaces("titleBar")(TitleBar));

const styles = StyleSheet.create({
  backContainer: {
    width: 69, // must equal pending + hamburger
  },
  hamburgerContainer: {
    width: 40,
  },
  actionContent: {
    height: 21,
    color: TITLEBAR_TEXT_COLOR,
    fontSize: REGULAR_TEXT,
    marginHorizontal: GUTTER / 2,
  },
  barContainer: {
    height: NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT,
  },
  demoView: {
    backgroundColor: DEMO_MODE_COLOR,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT,
  },
  hamburgerIcon: {
    textAlign: "right",
    fontSize: LARGE_TEXT,
    fontWeight: "bold",
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  pendingIcon: { height: 18, width: 29 },
  titleContainer: {
    marginTop: STATUS_BAR_HEIGHT,
    marginBottom: GUTTER / 2,
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  titleImage: {
    aspectRatio: 112 / 23,
    width: 140,
  },
});
