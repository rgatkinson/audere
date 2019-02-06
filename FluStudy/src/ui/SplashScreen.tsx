// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { View, StyleSheet } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { Action } from "../store";
import Button from "./components/Button";
import Title from "./components/Title";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  dispatch(action: Action): void;
}

@connect()
class SplashScreen extends React.PureComponent<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        <Title label={t("welcome")} />
        <Button
          enabled={true}
          primary={true}
          label={t("getStarted")}
          onPress={() => {
            this.props.navigation.push("Welcome");
          }}
        />
        <Button
          enabled={true}
          primary={true}
          label={t("haveKit")}
          onPress={() => {
            this.props.navigation.push("WelcomeBack");
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "space-around",
  },
});

export default withNamespaces("splashScreen")(SplashScreen);
