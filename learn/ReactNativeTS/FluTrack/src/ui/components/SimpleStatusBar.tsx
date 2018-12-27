import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  title: string;
}

export default class SimpleStatusBar extends React.Component<Props> {
  render() {
    return (
      <View style={styles.statusBar}>
        <Text style={styles.statusBarTitle}>{this.props.title}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  statusBar: {
    backgroundColor: "#E8E3D3",
    height: 90,
    justifyContent: "center",
    padding: 20,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 2,
    shadowOpacity: 0.5,
  },
  statusBarTitle: {
    fontFamily: "OpenSans-Regular",
    fontSize: 20,
    letterSpacing: -0.41,
    lineHeight: 22,
  },
});
