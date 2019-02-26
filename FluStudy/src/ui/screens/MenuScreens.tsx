// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Clipboard, Platform } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { Constants } from "expo";
import { getApiBaseUrl } from "../../transport";
import Screen from "../components/Screen";
import { timestampRender, timestampInteraction } from "./analytics";

const buildInfo = require("../../../buildInfo.json");

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

class AboutScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender(
      "About",
      <Screen
        canProceed={true}
        desc={t("description")}
        logo={true}
        navigation={this.props.navigation}
        title={t("title")}
        onBack={() => this.props.navigation.navigate("Home")}
        onNext={() => {}}
      />
    );
  }
}
export const About = withNamespaces("aboutScreen")<Props>(AboutScreen);

class FundingScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender(
      "Funding",
      <Screen
        canProceed={true}
        desc={t("description")}
        logo={true}
        navigation={this.props.navigation}
        title={t("title")}
        onBack={() => this.props.navigation.navigate("Home")}
        onNext={() => {}}
      />
    );
  }
}
export const Funding = withNamespaces("fundingScreen")<Props>(FundingScreen);

class PartnersScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender(
      "Partners",
      <Screen
        canProceed={true}
        desc={t("description")}
        logo={true}
        navigation={this.props.navigation}
        title={t("title")}
        onBack={() => this.props.navigation.navigate("Home")}
        onNext={() => {}}
      />
    );
  }
}
export const Partners = withNamespaces("partnersScreen")<Props>(PartnersScreen);

class GeneralQuestionsScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender(
      "GeneralQuestions",
      <Screen
        canProceed={true}
        desc={t("description")}
        logo={true}
        navigation={this.props.navigation}
        title={t("title")}
        onBack={() => this.props.navigation.navigate("Home")}
        onNext={() => {}}
      />
    );
  }
}
export const GeneralQuestions = withNamespaces("generalQuestionsScreen")<Props>(
  GeneralQuestionsScreen
);

class ProblemsScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender(
      "Problems",
      <Screen
        canProceed={true}
        desc={t("description")}
        logo={true}
        navigation={this.props.navigation}
        title={t("title")}
        onBack={() => this.props.navigation.navigate("Home")}
        onNext={() => {}}
      />
    );
  }
}
export const Problems = withNamespaces("problemsScreen")<Props>(ProblemsScreen);

class TestQuestionsScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender(
      "TestQuestions",
      <Screen
        canProceed={true}
        desc={t("description")}
        logo={true}
        navigation={this.props.navigation}
        title={t("title")}
        onBack={() => this.props.navigation.navigate("Home")}
        onNext={() => {}}
      />
    );
  }
}
export const TestQuestions = withNamespaces("testQuestionsScreen")<Props>(
  TestQuestionsScreen
);

class GiftcardQuestionsScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender(
      "GiftcardQuestions",
      <Screen
        canProceed={true}
        desc={t("description")}
        logo={true}
        navigation={this.props.navigation}
        title={t("title")}
        onBack={() => this.props.navigation.navigate("Home")}
        onNext={() => {}}
      />
    );
  }
}
export const GiftcardQuestions = withNamespaces("giftcardQuestionsScreen")<
  Props
>(GiftcardQuestionsScreen);

class ContactSupportScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return timestampRender(
      "ContactSupport",
      <Screen
        canProceed={true}
        desc={t("description")}
        logo={true}
        navigation={this.props.navigation}
        title={t("title")}
        onBack={() => this.props.navigation.navigate("Home")}
        onNext={() => {}}
      />
    );
  }
}
export const ContactSupport = withNamespaces("contactSupportScreen")<Props>(
  ContactSupportScreen
);

class VersionScreen extends React.Component<Props & WithNamespaces> {
  copyToClipboard = async (text: string) => {
    await Clipboard.setString(text);
  };

  render() {
    const { t } = this.props;
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
        title={t("title")}
        onBack={() => this.props.navigation.navigate("Home")}
        onNext={() => {
          timestampInteraction("About.Copy");
          this.copyToClipboard(aboutContent);
        }}
      />
    );
  }
}
export const Version = withNamespaces("versionScreen")<Props>(VersionScreen);
