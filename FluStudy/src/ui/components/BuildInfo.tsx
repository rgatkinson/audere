import React from "react";
import {
  Clipboard,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { Constants } from "expo";
import { ios, DEVICE_INFO } from "../../transport/DeviceInfo";
import Button from "./Button";
import Text from "./Text";
import { getApiBaseUrl } from "../../transport";
import { GUTTER } from "../styles";

interface Props {}

const buildInfo = require("../../../buildInfo.json");

class BuildInfo extends React.Component<Props & WithNamespaces> {
  _copyToClipboard = async () => {
    await Clipboard.setString(this._getBuildContent());
  };

  _getBuildContent = () => {
    const { t } = this.props;
    return (
      t("buildInfo:version") +
      buildInfo.version +
      t("buildInfo:build") +
      (ios ? buildInfo.iosBuild : Constants.platform.android.versionCode) +
      t("buildInfo:commit") +
      buildInfo.hash +
      t("buildInfo:date") +
      buildInfo.buildDate +
      t("buildInfo:device") +
      Platform.OS +
      " " +
      Platform.Version +
      t("buildInfo:installation") +
      Constants.installationId +
      t("buildInfo:apiServer") +
      getApiBaseUrl()
    );
  };

  render() {
    const { t } = this.props;

    return (
      <View style={styles.container}>
        <Text content={this._getBuildContent()} style={styles.content} />
        <Button
          enabled={true}
          label={t("copy")}
          primary={true}
          onPress={this._copyToClipboard}
        />
        <Text content={t("copyright")} style={styles.footer} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    alignSelf: "stretch",
  },
  content: {
    marginVertical: GUTTER,
  },
  footer: {
    alignSelf: "stretch",
    textAlign: "center",
  },
});

export default withNamespaces("buildInfo")(BuildInfo);
