// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { connect } from "react-redux";
import { Feather } from "@expo/vector-icons";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { StoreState } from "../../store";
import Text from "./Text";
import {
  GUTTER,
  NAV_BAR_HEIGHT,
  STATUS_BAR_HEIGHT,
  SYSTEM_FONT,
  SYSTEM_TEXT,
} from "../styles";

interface Props {
  demoMode?: boolean;
  hideBackButton?: boolean;
  menuItem?: boolean;
  navigation: NavigationScreenProp<any, any>;
}

class NavigationBar extends React.Component<Props & WithNamespaces> {
  _debounce = 0;

  _goHome = () => {
    this.props.navigation.navigate("Home");
  };

  _onBack = () => {
    if (this._debounce) {
      return;
    }

    // @ts-ignore
    this._debounce = setTimeout(() => {
      this._debounce = 0;
    }, 1000);

    this.props.navigation.pop();
  };

  _onMenu = () => {
    this.props.navigation.openDrawer();
  };

  _getContent = () => {
    const { navigation, demoMode } = this.props;
    const currentRoute = navigation.state.routeName;
    return demoMode
      ? "Demo Mode"
      : currentRoute === "Scan"
        ? "flu@home: barcode scan"
        : "flu@home";
  };

  render() {
    const { demoMode, hideBackButton, menuItem, navigation } = this.props;
    return (
      <View style={styles.container}>
        {demoMode && <View style={styles.demoView} />}
        {!!hideBackButton ? (
          <View style={{ width: 30 }} />
        ) : !!menuItem ? (
          <TouchableOpacity
            style={styles.actionContainer}
            onPress={this._goHome}
          >
            <Feather color="white" name="x" size={30} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.actionContainer}
            onPress={this._onBack}
          >
            <Feather color="white" name="arrow-left" size={30} />
          </TouchableOpacity>
        )}
        <Text style={styles.title} center={true} content={this._getContent()} />
        <TouchableOpacity style={styles.actionContainer} onPress={this._onMenu}>
          <Feather color="white" name={"menu"} size={30} />
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  actionContainer: {
    alignItems: "center",
    flexDirection: "row",
  },
  demoView: {
    backgroundColor: "green",
    opacity: 0.5,
    paddingTop: STATUS_BAR_HEIGHT,
    position: "absolute",
    top: 0,
    left: 0,
    lineHeight: NAV_BAR_HEIGHT,
    right: 0,
    height: NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT,
  },
  container: {
    alignItems: "center",
    backgroundColor: "transparent",
    flexDirection: "row",
    height: NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT,
    justifyContent: "space-between",
    paddingTop: STATUS_BAR_HEIGHT,
    paddingHorizontal: GUTTER / 2,
  },
  title: {
    alignSelf: "center",
    color: "white",
    fontFamily: SYSTEM_FONT,
    fontSize: SYSTEM_TEXT,
    fontWeight: "bold",
  },
});

export default connect((state: StoreState) => ({
  demoMode: state.meta.isDemo,
}))(withNamespaces()(NavigationBar));
