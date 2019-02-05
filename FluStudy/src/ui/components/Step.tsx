import React from "react";
import { StyleSheet, Text } from "react-native";

interface Props {
  step: number;
  totalSteps: number;
}

export default class Step extends React.Component<Props> {
  render() {
    return (
      <Text style={styles.container}>
        <Text style={styles.bold}>Step {this.props.step}</Text> of{" "}
        {this.props.totalSteps}
      </Text>
    );
  }
}

const styles = StyleSheet.create({
  bold: {
    fontFamily: "OpenSans-Bold",
  },
  container: {
    alignSelf: "stretch",
    color: "#333",
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    marginVertical: 0,
    textAlign: "center",
  },
});
