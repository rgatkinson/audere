// Custom text component that just adds some default styles to Text -- SO ANNOYING

import React from "react";
import { Text as RNText, StyleSheet } from "react-native";

export type SizeType = "normal" | "heading" | "title" | undefined;
interface Props {
  style?: any;
  size?: SizeType;
}

function getStyle(size: SizeType) {
  switch (size) {
    case "heading":
      return styles.headingText;
    case "title":
      return styles.titleText;
    default:
      return styles.normalText;
  }
}
export default class Text extends React.Component<Props, any> {
  render() {
    return (
      <RNText style={[getStyle(this.props.size), this.props.style]}>
        {this.props.children}
      </RNText>
    );
  }
}
const styles = StyleSheet.create({
  titleText: {
    fontSize: 30,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 6,
    padding: 20,
  },
  normalText: {
    fontSize: 15,
  },
  headingText: {
    fontSize: 18,
    padding: 15,
  },
});
