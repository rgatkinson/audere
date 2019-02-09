// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { Action } from "../store";
import Button from "./components/Button";
import Screen from "./components/Screen";
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
      <Screen
        alignTop={true}
        buttonLabel={t("haveKit")}
        canProceed={true}
        logo={true}
        navBar={false}
        navigation={this.props.navigation}
        title={t("welcome")}
        onNext={() => {
          this.props.navigation.push("WelcomeBack");
        }}
      >
        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => {
            this.props.navigation.push("Welcome");
          }}
        >
          <Title label={t("getStarted")} />
        </TouchableOpacity>
      </Screen>
    );
  }
}
const styles = StyleSheet.create({
  mainButton: {
    borderColor: "#333",
    borderRadius: 8,
    borderWidth: 2,
    width: 300,
    height: 75,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
});

export default withNamespaces("splashScreen")(SplashScreen);
