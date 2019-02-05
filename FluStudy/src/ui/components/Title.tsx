import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Text from "./Text";

interface Props {
  label: string;
  style?: StyleProp<ViewStyle>;
}

export default class Title extends React.Component<Props> {
  render() {
    return (
      <Text
        center={true}
        content={this.props.label}
        extraBold={true}
        style={[styles.title, this.props.style && this.props.style]}
      />
    );
  }
}

const styles = StyleSheet.create({
  title: {
    color: "#666",
    fontFamily: "OpenSans-SemiBold",
    fontSize: 24,
  },
});
