import React from "react";
import { StyleSheet, Clipboard, Platform, View } from "react-native";
import Button from "../components/Button";
import ScreenView from "../components/ScreenView";
import Text from "../components/Text";
import { NavigationScreenProp } from "react-navigation";

const appInfo = require("../../../app.json");
const buildInfo = require("../../../buildInfo.json");

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

export default class AboutScreen extends React.Component<Props> {
  static navigationOptions = {
    title: "About",
  };

  copyToClipboard = async () => {
    await Clipboard.setString(
      "Version: " +
        appInfo.expo.version +
        "\nCommit: " +
        buildInfo.hash +
        "\nDate: " +
        buildInfo.buildDate +
        "\nExpo SDK: " +
        appInfo.expo.sdkVersion +
        "\nDevice: " +
        Platform.OS +
        " " +
        Platform.Version
    );
  };

  render() {
    return (
      <ScreenView>
        <Text size="heading">About {appInfo.expo.name}</Text>
        <View>
          <Text>Version: {appInfo.expo.version}</Text>
          <Text>Commit: {buildInfo.hash}</Text>
          <Text>Date: {buildInfo.buildDate}</Text>
          <Text>Expo SDK: {appInfo.expo.sdkVersion}</Text>
          <Text>
            Device: {Platform.OS} {Platform.Version}
          </Text>
        </View>
        <Button
          title="Copy"
          style={styles.component}
          onPress={this.copyToClipboard}
        />
      </ScreenView>
    );
  }
}

const styles = StyleSheet.create({
  component: {
    padding: 20,
    marginTop: 30,
  },
});
