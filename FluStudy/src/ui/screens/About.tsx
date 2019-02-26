// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Clipboard, Platform } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { Constants } from "expo";
import { getApiBaseUrl } from "../../transport";
import Screen from "../components/Screen";
import { timestampRender, timestampInteraction } from "./analytics";

const buildInfo = require("../../../buildInfo.json");

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

export default class About extends React.Component<Props> {
  copyToClipboard = async (text: string) => {
    await Clipboard.setString(text);
  };

  render() {
    const aboutContent: string =
      "**Version:** " +
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

    return timestampRender(
      "About",
      <Screen
        buttonLabel="Copy"
        canProceed={true}
        desc={aboutContent}
        logo={true}
        navigation={this.props.navigation}
        title={buildInfo.name}
        onBack={() => this.props.navigation.navigate("Home")}
        onNext={() => {
          timestampInteraction("About.Copy");
          this.copyToClipboard(aboutContent);
        }}
      />
    );
  }
}
