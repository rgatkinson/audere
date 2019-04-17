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
import { getDeviceSetting } from "../../util/deviceSettings";
import { uploader } from "../../store/uploader";

const buildInfo = require("../../../buildInfo.json");

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

interface State {
  encryptionKey: string | null;
}

export default class AboutScreen extends React.Component<Props, State> {
  static navigationOptions = {
    title: "About",
  };

  state = { encryptionKey: null };

  copyToClipboard = async (text: string) => {
    await Clipboard.setString(text);
  };

  componentDidMount = async () => {
    if (await getDeviceSetting("DISPLAY_ENCRYPTION_KEY")) {
      this.setState({ encryptionKey: await uploader.getEncryptionPassword() });
    }
  };

  render = () => {
    let aboutContent: string =
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

    console.log(this.state);
    if (this.state.encryptionKey) {
      aboutContent += "\nEncryption Key: " + this.state.encryptionKey;
    }

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
  };
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
