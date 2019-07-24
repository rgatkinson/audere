// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

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
import Constants from "expo-constants";
import { DEVICE_INFO } from "../../transport/DeviceInfo";
import Button from "./Button";
import Text from "./Text";
import { getApiBaseUrl } from "../../transport";
import { GUTTER } from "../styles";

class BuildInfo extends React.Component<WithNamespaces> {
  _copyToClipboard = async () => {
    await Clipboard.setString(this._getBuildContent());
  };

  _getBuildContent = () => {
    const { t } = this.props;
    return (
      t("buildInfo:version") +
      DEVICE_INFO.clientVersion.version +
      t("buildInfo:build") +
      DEVICE_INFO.clientBuild +
      t("buildInfo:commit") +
      DEVICE_INFO.clientVersion.hash +
      t("buildInfo:date") +
      DEVICE_INFO.clientVersion.buildDate +
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
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    alignSelf: "stretch",
    marginBottom: GUTTER,
  },
  content: {
    marginBottom: GUTTER,
  },
  footer: {
    alignSelf: "stretch",
    textAlign: "center",
  },
});

export default withNamespaces("buildInfo")(BuildInfo);
