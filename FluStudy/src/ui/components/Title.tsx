import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Text from "./Text";
import {
  EXTRA_LARGE_TEXT,
  FONT_NORMAL,
  GUTTER,
  PRIMARY_COLOR,
} from "../styles";

interface Props {
  label: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => any;
}

export default class Title extends React.Component<Props> {
  render() {
    return (
      <Text
        center={true}
        content={this.props.label}
        extraBold={true}
        onPress={this.props.onPress}
        style={[styles.title, this.props.style && this.props.style]}
      />
    );
  }
}

const styles = StyleSheet.create({
  title: {
    color: PRIMARY_COLOR,
    fontFamily: FONT_NORMAL,
    fontSize: EXTRA_LARGE_TEXT,
    paddingTop: GUTTER,
  },
});
