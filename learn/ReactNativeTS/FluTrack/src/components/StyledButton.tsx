import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors } from "../Styles";

interface Props {
  title: string;
  onPress(arg: any): void;
}

// Custom button that looks like the button on auderenow.org
export default class StyledButton extends React.Component<Props> {
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

const HEIGHT = 44;

const styles = StyleSheet.create({
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  styledButton: {
    alignItems: "center",
    justifyContent: "center",
    margin: 8,
    paddingHorizontal: 30,
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    backgroundColor: colors.accent,
  },
});
