// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Dimensions, Image, View, StyleSheet, Switch } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { Action, setDemo, StoreState } from "../store";
import Screen from "./components/Screen";
import Title from "./components/Title";
import { GUTTER, STATUS_BAR_HEIGHT } from "./styles";

interface Props {
  demoMode: boolean;
  navigation: NavigationScreenProp<any, any>;
  dispatch(action: Action): void;
}

@connect((state: StoreState) => ({
  demoMode: state.meta.isDemo,
}))
class AboutScreen extends React.PureComponent<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <View style={{ marginTop: STATUS_BAR_HEIGHT }}>
        <Image
          style={{ height: 120, width: Dimensions.get("window").width }}
          source={require("../img/logo.png")}
        />
        <View style={styles.container}>
          <View style={styles.rowContainer}>
            <Title label={t("demoMode")} />
            <Switch
              value={this.props.demoMode}
              onValueChange={value => this.props.dispatch(setDemo(value))}
            />
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    margin: GUTTER,
  },
  rowContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default withNamespaces("aboutScreen")(AboutScreen);
