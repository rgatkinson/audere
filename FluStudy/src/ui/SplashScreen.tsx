// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { View } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import Button from "./components/Button";
import Screen from "./components/Screen";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

class SplashScreen extends React.PureComponent<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <Screen
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
        <Button
          enabled={true}
          label={t("getStarted")}
          primary={false}
          style={{ height: 75, marginTop: 125 }}
          onPress={() => {
            this.props.navigation.push("Welcome");
          }}
        />
      </Screen>
    );
  }
}

export default withNamespaces("splashScreen")(SplashScreen);
