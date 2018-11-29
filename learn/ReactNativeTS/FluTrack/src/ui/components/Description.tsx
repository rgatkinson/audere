import React from "react";
import { StyleSheet, Text } from "react-native";

interface Props {
  content: string;
  center?: boolean;
}

export default class Description extends React.Component<Props> {
  render() {
    return (
      <Text style={[styles.description, this.props.center && styles.center]}>
        {this.props.content}
      </Text>
    );
  }
}

const styles = StyleSheet.create({
  center: {
    textAlign: "center",
  },
  description: {
    alignSelf: "stretch",
    fontFamily: "OpenSans-Regular",
    fontSize: 21,
    letterSpacing: -0.51,
    lineHeight: 26,
    marginVertical: 20,
  },
});
