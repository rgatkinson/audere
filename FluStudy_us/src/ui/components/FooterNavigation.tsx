// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { View, StyleSheet } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  withNavigation,
  NavigationScreenProp,
  StackActions,
} from "react-navigation";
import { FOOTER_HEIGHT } from "../styles";
import Button from "./Button";
import StepDots from "./StepDots";

interface StepConfig {
  step: number;
  total: number;
}

interface Props {
  hideBackButton?: boolean;
  navigation: NavigationScreenProp<any, any>;
  next?: string;
  stepDots: StepConfig;
}

class FooterNavigation extends React.Component<Props & WithNamespaces> {
  shouldComponentUpdate(props: Props & WithNamespaces) {
    return (
      props.hideBackButton != this.props.hideBackButton ||
      props.stepDots != this.props.stepDots
    );
  }

  _onNext = () => {
    const { navigation, next } = this.props;
    next && navigation.dispatch(StackActions.push({ routeName: next }));
  };

  _pop = () => {
    this.props.navigation.dispatch(StackActions.pop({ n: 1 }));
  };

  render() {
    const { hideBackButton, stepDots, t } = this.props;

    return (
      <View style={styles.container}>
        <Button
          enabled={!hideBackButton}
          label={hideBackButton ? " " : t("common:button:back")}
          primary={false}
          style={styles.button}
          onPress={this._pop}
        />
        {/* <StepDots step={stepDots.step} total={stepDots.total} /> */}
        <Button
          enabled={true}
          label={t("common:button:next")}
          primary={false}
          style={styles.button}
          onPress={this._onNext}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 0,
    width: 80,
  },
  container: {
    flexDirection: "row",
    height: FOOTER_HEIGHT,
    width: "100%",
    flex: 1,
    justifyContent: "space-between",
  },
});

export default withNavigation(withNamespaces()(FooterNavigation));
