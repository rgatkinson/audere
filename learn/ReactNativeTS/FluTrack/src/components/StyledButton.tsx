// Custom button that looks like the button on auderenow.org

import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors } from "../Styles";

interface Props {
  title: string;
  onPress(arg: any): void;
}
export default class StyledButton extends React.Component<Props, any> {
  render() {
    return (
      <TouchableOpacity
        style={styles.styledButton}
        activeOpacity={0.5}
        onPress={this.props.onPress}
      >
        <Text style={styles.buttonText}>{this.props.title}</Text>
      </TouchableOpacity>
    );
  }
}
const styles = StyleSheet.create({
  buttonText: {
    color: "white",
    fontWeight: "bold"
  },
  styledButton: {
    margin: 8,
    padding: 18,
    backgroundColor: colors.accent,
    borderRadius: 20,
    borderWidth: 0,
    height: 45,
    justifyContent: "center"
  }
});
