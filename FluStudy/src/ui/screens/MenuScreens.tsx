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
  Text as SystemText,
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
import { GUTTER, PRIMARY_COLOR, SYSTEM_FONT, SYSTEM_TEXT } from "./../styles";
import { ios, DEVICE_INFO } from "../../transport/DeviceInfo";
import Text from "../components/Text";

export const Menu = (props: any) => {
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
          onPress={() => {
            props.navigation.closeDrawer();
            if (props.activeItemKey !== "Home") {
              props.navigation.navigate("Home");
            }
          }}
        >
          <Feather color={PRIMARY_COLOR} name="x" size={30} />
        </TouchableOpacity>
        <SystemText style={styles.header}>ABOUT FLU@HOME</SystemText>
        <Divider style={styles.divider} />
        <DrawerItems {...aboutItems} />
        <SystemText style={styles.header}>HELP & SUPPORT</SystemText>
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
  footer: {
    marginBottom: GUTTER,
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
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        menuItem={true}
        navigation={this.props.navigation}
        skipButton={true}
        stableImageSrc={{ uri: "img/reverseLogo" }}
        title={t("title")}
      />
    );
  }
}
export const About = withNamespaces("aboutScreen")(AboutScreen);

class FundingScreen extends React.Component<Props & WithNamespaces> {
  static navigationOptions = () => {
    return {
      title: "Study Funding",
    };
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        menuItem={true}
        navigation={this.props.navigation}
        skipButton={true}
        stableImageSrc={{ uri: "img/reverseLogo" }}
        title={t("title")}
      />
    );
  }
}
export const Funding = withNamespaces("fundingScreen")(FundingScreen);

class PartnersScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        menuItem={true}
        navigation={this.props.navigation}
        skipButton={true}
        stableImageSrc={{ uri: "img/reverseLogo" }}
        title={t("title")}
      />
    );
  }
}
export const Partners = withNamespaces("partnersScreen")(PartnersScreen);

class GeneralQuestionsScreen extends React.Component<Props & WithNamespaces> {
  static navigationOptions = () => {
    return {
      title: "General Questions",
    };
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        menuItem={true}
        navigation={this.props.navigation}
        skipButton={true}
        stableImageSrc={{ uri: "img/reverseLogo" }}
        title={t("title")}
      />
    );
  }
}
export const GeneralQuestions = withNamespaces("generalQuestionsScreen")(
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
    return (
      <Screen
        canProceed={true}
        desc={t("description", {
          device: t("common:device:" + DEVICE_INFO.idiomText),
        })}
        menuItem={true}
        navigation={this.props.navigation}
        skipButton={true}
        stableImageSrc={{ uri: "img/reverseLogo" }}
        title={t("title")}
      />
    );
  }
}
export const Problems = withNamespaces("problemsScreen")(ProblemsScreen);

class TestQuestionsScreen extends React.Component<Props & WithNamespaces> {
  static navigationOptions = () => {
    return {
      title: "Test Questions",
    };
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        menuItem={true}
        navigation={this.props.navigation}
        skipButton={true}
        stableImageSrc={{ uri: "img/reverseLogo" }}
        title={t("title")}
      />
    );
  }
}
export const TestQuestions = withNamespaces("testQuestionsScreen")(
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
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        menuItem={true}
        navigation={this.props.navigation}
        skipButton={true}
        stableImageSrc={{ uri: "img/reverseLogo" }}
        title={t("title")}
      />
    );
  }
}
export const GiftcardQuestions = withNamespaces("giftcardQuestionsScreen")(
  GiftcardQuestionsScreen
);

class ContactSupportScreen extends React.Component<Props & WithNamespaces> {
  static navigationOptions = () => {
    return {
      title: "Contact Support",
    };
  };

  render() {
    const { t } = this.props;
    return (
      <Screen
        canProceed={true}
        desc={t("description")}
        menuItem={true}
        navigation={this.props.navigation}
        skipButton={true}
        stableImageSrc={{ uri: "img/reverseLogo" }}
        title={t("title")}
      />
    );
  }
}
export const ContactSupport = withNamespaces("contactSupportScreen")(
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
      t("version") +
      buildInfo.version +
      t("build") +
      (ios ? buildInfo.iosBuild : "") +
      t("commit") +
      buildInfo.hash +
      t("date") +
      buildInfo.buildDate +
      t("device") +
      Platform.OS +
      " " +
      Platform.Version +
      t("installation") +
      Constants.installationId +
      t("apiServer") +
      getApiBaseUrl();

    return (
      <Screen
        buttonLabel={t("copy")}
        canProceed={true}
        desc={aboutContent}
        footer={<Text content={t("copyright")} style={styles.footer} />}
        menuItem={true}
        navigation={this.props.navigation}
        skipButton={false}
        stableImageSrc={{ uri: "img/reverseLogo" }}
        title={t("title")}
        onNext={() => this.copyToClipboard(aboutContent)}
      />
    );
  }
}
export const Version = withNamespaces("versionScreen")(VersionScreen);
