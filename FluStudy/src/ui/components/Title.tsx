import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Text from "./Text";
import {
  EXTRA_LARGE_TEXT,
  FONT_SEMI_BOLD,
  GUTTER,
  SECONDARY_COLOR,
} from "../styles";

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
    color: SECONDARY_COLOR,
    fontFamily: FONT_SEMI_BOLD,
    fontSize: EXTRA_LARGE_TEXT,
    marginVertical: GUTTER / 2,
  },
});
