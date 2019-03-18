import React from "react";
import { StyleSheet } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Text from "./Text";
import { FONT_NORMAL, GUTTER, PRIMARY_COLOR, REGULAR_TEXT } from "../styles";

interface Props {
  step: number;
  totalSteps: number;
}

class Step extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <Text
        content={t("step", {
          step: this.props.step,
          total: this.props.totalSteps,
        })}
        style={styles.container}
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    color: PRIMARY_COLOR,
    fontFamily: FONT_NORMAL,
    fontSize: REGULAR_TEXT,
    marginTop: GUTTER / 2,
    textAlign: "center",
  },
});

export default withNamespaces("step")(Step);
