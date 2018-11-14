import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  label: string;
  size?: "large" | "small";
}

export default class Title extends React.Component<Props> {
  render() {
    return (
      <Text
        style={[
          styles.title,
          this.props.size && this.props.size == "large" && styles.large,
          this.props.size && this.props.size == "small" && styles.small,
        ]}
      >
        {this.props.label}
      </Text>
    );
  }
}

const styles = StyleSheet.create({
  small: {
    fontSize: 33,
    letterSpacing: 0.16,
    lineHeight: 40,
  },
  large: {
    fontSize: 63,
    letterSpacing: 0.74,
    lineHeight: 83,
  },
  title: {
    alignSelf: "stretch",
    color: "#4B2E83",
    fontFamily: "OpenSans-Bold",
    fontSize: 49,
    letterSpacing: 0.24,
    lineHeight: 58,
    marginVertical: 20,
    textAlign: "center",
  },
});
