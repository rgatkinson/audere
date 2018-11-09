import React from "react";
import { StyleSheet, Text } from "react-native";

interface Props {
  content: string;
}

export default class Description extends React.Component<Props> {
  render() {
    return <Text style={styles.description}>{this.props.content}</Text>;
  }
}

const styles = StyleSheet.create({
  description: {
    alignSelf: "stretch",
    fontSize: 24,
    marginVertical: 20,
  },
});
