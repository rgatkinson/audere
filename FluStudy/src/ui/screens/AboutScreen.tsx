// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  Clipboard,
  Dimensions,
  Image,
  Platform,
  View,
  StyleSheet,
  Switch,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { Constants } from "expo";
import { connect } from "react-redux";
import { getApiBaseUrl } from "../../transport";
import { Action, setDemo, StoreState } from "../../store";
import Button from "../components/Button";
import Screen from "../components/Screen";
import Text from "../components/Text";
import Title from "../components/Title";
import { GUTTER, STATUS_BAR_HEIGHT } from "../styles";

const buildInfo = require("../../../buildInfo.json");

interface Props {
  demoMode: boolean;
  navigation: NavigationScreenProp<any, any>;
  dispatch(action: Action): void;
}

@connect((state: StoreState) => ({
  demoMode: state.meta.isDemo,
}))
class AboutScreen extends React.PureComponent<Props & WithNamespaces> {
  copyToClipboard = async (text: string) => {
    await Clipboard.setString(text);
  };

  render() {
    const aboutContent: string =
      "**" +
      buildInfo.name +
      "**" +
      "\n**Version:** " +
      buildInfo.version +
      "\n**Commit:** " +
      buildInfo.hash +
      "\n**Date:** " +
      buildInfo.buildDate +
      "\n**Device:** " +
      Platform.OS +
      " " +
      Platform.Version +
      "\n**Installation:** " +
      Constants.installationId +
      "\n**API Server:** " +
      getApiBaseUrl();

    const { t } = this.props;
    return (
      <View style={{ marginTop: STATUS_BAR_HEIGHT }}>
        <Image
          style={{ height: 120, width: Dimensions.get("window").width }}
          source={require("../../img/logo.png")}
        />
        <View style={styles.container}>
          <View style={styles.rowContainer}>
            <Title label={t("demoMode")} />
            <Switch
              value={this.props.demoMode}
              onValueChange={value => this.props.dispatch(setDemo(value))}
            />
          </View>
          <Text content={aboutContent} />
          <Button
            label="Copy"
            primary={true}
            enabled={true}
            style={{ marginTop: GUTTER }}
            onPress={() => {
              this.copyToClipboard(aboutContent);
            }}
          />
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
