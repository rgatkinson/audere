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
    fontFamily: "OpenSans-Regular",
    fontSize: 21,
    marginVertical: 10,
    textAlign: "center",
  },
});
