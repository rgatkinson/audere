// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Clipboard, Platform, View, StyleSheet } from "react-native";
import { Constants } from "expo";
import { getApiBaseUrl } from "../../transport";
import Button from "../components/Button";
import Logo from "../components/Logo";
import Screen from "../components/Screen";
import Text from "../components/Text";
import { GUTTER, STATUS_BAR_HEIGHT } from "../styles";

const buildInfo = require("../../../buildInfo.json");

export default class AboutScreen extends React.PureComponent {
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

    return (
      <View style={{ marginTop: STATUS_BAR_HEIGHT }}>
        <Logo />
        <View style={styles.container}>
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
});
