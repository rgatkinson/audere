import React from "react";
import { StyleSheet, Clipboard } from "react-native";
import Button from "../components/Button";
import ScreenView from "../components/ScreenView";
import Text from "../components/Text";
import { NavigationScreenProp } from "react-navigation";

const packageInfo = require("../../../package.json");
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
        packageInfo.version +
        "\nBuild: " +
        buildInfo.buildDate +
        "_" +
        buildInfo.hash
    );
  };

  render() {
    return (
      <ScreenView>
        <Text size="heading">About {packageInfo.name}</Text>
        <Text>Version: {packageInfo.version}</Text>
        <Text>
          Build: {buildInfo.buildDate}_{buildInfo.hash}
        </Text>
        <Button
          title="Copy to clipboard"
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
  },
});
