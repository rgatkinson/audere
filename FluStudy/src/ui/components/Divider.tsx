import React from "react";
import { View, StyleSheet } from "react-native";
import { BORDER_COLOR, GUTTER } from "../styles";

export default class Divider extends React.Component {
  render() {
    return <View style={styles.container} />;
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    borderBottomColor: BORDER_COLOR,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: GUTTER,
  },
});
