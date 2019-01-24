import React from "react";
import {
  StyleSheet,
  Clipboard,
  Platform,
  View,
  Text,
  TextStyle,
} from "react-native";
import ScreenContainer from "../components/ScreenContainer";
import ContentContainer from "../components/ContentContainer";
import { NavigationScreenProp } from "react-navigation";
import { Constants } from "expo";
import Button from "../components/Button";
import { getApiBaseUrl } from "../../transport";

const buildInfo = require("../../../buildInfo.json");

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

export default class AboutScreen extends React.Component<Props> {
  static navigationOptions = {
    title: "About",
  };

  copyToClipboard = async (text: string) => {
    await Clipboard.setString(text);
  };

  render() {
    const aboutContent: string =
      "Version: " +
      buildInfo.version +
      "\nCommit: " +
      buildInfo.hash +
      "\nDate: " +
      buildInfo.buildDate +
      "\nDevice: " +
      Platform.OS +
      " " +
      Platform.Version +
      "\nInstallation: " +
      Constants.installationId +
      "\nAPI Server: " +
      getApiBaseUrl();

    return (
      <ScreenContainer>
        <ContentContainer>
          <Text style={styles.headerText as TextStyle}>
            About {buildInfo.name}
          </Text>
          <View style={styles.aboutContainer}>
            <Text style={styles.aboutText}>{aboutContent}</Text>
          </View>
          <Button
            label="Copy"
            primary={true}
            enabled={true}
            onPress={() => {
              this.copyToClipboard(aboutContent);
            }}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

const styles = StyleSheet.create({
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    padding: 30,
  },
  aboutContainer: {
    margin: 20,
  },
  aboutText: {
    fontSize: 17,
  },
  copyButton: {
    padding: 20,
    marginTop: 30,
  },
});
