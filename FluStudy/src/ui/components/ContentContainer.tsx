import React from "react";
import { StyleSheet, View } from "react-native";

export default class ContentContainer extends React.Component {
  render() {
    return <View style={styles.contentContainer}>{this.props.children}</View>;
  }
}

const styles = StyleSheet.create({
  contentContainer: {
    alignItems: "center",
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
  },
});
