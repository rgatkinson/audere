import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  label: string;
  bold?: boolean;
}

export default class Title extends React.Component<Props> {
  render() {
    return (
      <Text style={[styles.title, this.props.bold && styles.bold]}>
        {this.props.label}
      </Text>
    );
  }
}

const styles = StyleSheet.create({
  bold: {
    fontWeight: "bold",
  },
  title: {
    alignSelf: "stretch",
    color: "#6200EE",
    fontSize: 48,
    margin: 20,
    textAlign: "center",
  },
});
