// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  Clipboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  DrawerItems,
  NavigationScreenProp,
  SafeAreaView,
} from "react-navigation";
import { Feather } from "@expo/vector-icons";
import Divider from "./../components/Divider";
import Screen from "./../components/Screen";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { Constants } from "expo";
import { getApiBaseUrl } from "../../transport";
import { timestampRender, timestampInteraction } from "./analytics";
import {
  GUTTER,
  LINK_COLOR,
  STATUS_BAR_HEIGHT,
  SYSTEM_FONT,
  SYSTEM_TEXT,
} from "./../styles";

export const Menu = (props: any) => {
  const homeItem = { ...props, items: props.items.slice(0, 1) };
  const aboutItems = { ...props, items: props.items.slice(1, 4) };
  const helpItems = { ...props, items: props.items.slice(4) };
  return (
    <ScrollView>
      <SafeAreaView
        style={styles.container}
        forceInset={{ top: "always", horizontal: "never" }}
      >
        <TouchableOpacity
          style={styles.icon}
          onPress={props.navigation.closeDrawer}
        >
          <Feather color={LINK_COLOR} name="x" size={30} />
        </TouchableOpacity>
        <DrawerItems {...homeItem} />
        <Text style={styles.header}>ABOUT FLU@HOME</Text>
        <Divider style={styles.divider} />
        <DrawerItems {...aboutItems} />
        <Text style={styles.header}>HELP & SUPPORT</Text>
        <Divider style={styles.divider} />
        <DrawerItems {...helpItems} />
      </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: GUTTER,
  },
  divider: {
    marginTop: GUTTER / 2,
    marginRight: GUTTER,
  },
  header: {
    fontFamily: SYSTEM_FONT,
    fontSize: SYSTEM_TEXT,
    marginTop: GUTTER,
  },
  icon: {
    alignSelf: "flex-end",
    justifyContent: "center",
  },
});

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

const buildInfo = require("../../../buildInfo.json");

class AboutScreen extends React.Component<Props & WithNamespaces> {
  static navigationOptions = () => {
    return {
      title: "About the Study",
    };
  };

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
  static navigationOptions = () => {
    return {
      title: "Study Funding",
    };
  };

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
  static navigationOptions = () => {
    return {
      title: "General Questions",
    };
  };

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
  static navigationOptions = () => {
    return {
      title: "Problems With the App",
    };
  };

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
  static navigationOptions = () => {
    return {
      title: "Test Questions",
    };
  };

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
  static navigationOptions = () => {
    return {
      title: "Gift Card Questions",
    };
  };

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
  static navigationOptions = () => {
    return {
      title: "Contact Support",
    };
  };

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
  static navigationOptions = () => {
    return {
      title: "App Version",
    };
  };

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
