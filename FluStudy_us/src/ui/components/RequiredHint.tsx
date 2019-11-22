import React from "react";
import { StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Text from "./Text";
import { GUTTER, ERROR_COLOR } from "../styles";

class RequiredHint extends React.Component<WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <View style={styles.hintContainer}>
        <Text content={"*"} style={{ color: ERROR_COLOR }} />
        <Text content={" = " + t("common:requiredHint:desc")} />
      </View>
    );
  }
}

export default withNamespaces()(RequiredHint);

const styles = StyleSheet.create({
  hintContainer: {
    flexDirection: "row",
    marginBottom: GUTTER,
  },
});
