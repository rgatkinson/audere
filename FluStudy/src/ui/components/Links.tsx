import React from "react";
import { StyleProp, StyleSheet, TextStyle } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Text from "./Text";

interface Props {}

class Links extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <Text
        style={styles.bold}
        content={t("shareLink") + "\n" + t("learnLink") + "\n" + t("medLink")}
      />
    );
  }
}

const styles = StyleSheet.create({
  bold: {
    fontFamily: "OpenSans-Bold",
  },
});

export default withNamespaces("links")<Props>(Links);
