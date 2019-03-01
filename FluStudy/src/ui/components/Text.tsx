import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text as SystemText,
  TextStyle,
} from "react-native";
import { createIconSetFromFontello } from "@expo/vector-icons";
import fontelloConfig from "../../../assets/fonts/fontelloConfig.json";
const Icon = createIconSetFromFontello(fontelloConfig);
import {
  FONT_BOLD,
  FONT_EXTRA_BOLD,
  FONT_ITALIC,
  FONT_NORMAL,
  GUTTER,
  REGULAR_TEXT,
  TEXT_COLOR,
} from "../styles";

interface Props {
  bold?: boolean;
  center?: boolean;
  content: string;
  extraBold?: boolean;
  italic?: boolean;
  style?: StyleProp<TextStyle>;
  onPress?: () => any;
}

export default class Text extends React.Component<Props> {
  _oneReplace(str: string, bold: boolean) {
    return str
      .split("①")
      .map(
        (subStr, j) =>
          j % 2 === 1 ? (
            <Icon
              key={"circle1" + j}
              color="green"
              name="numeric-1-circle"
              size={20}
            />
          ) : (
            this._twoReplace(subStr, bold)
          )
      );
  }

  _twoReplace(str: string, bold: boolean) {
    return str
      .split("②")
      .map(
        (subStr, j) =>
          j % 2 === 1 ? (
            <Icon
              key={"circle2" + j}
              color="black"
              name="numeric-2-circle"
              size={20}
            />
          ) : (
            this._threeReplace(subStr, bold)
          )
      );
  }

  _threeReplace(str: string, bold: boolean) {
    return str
      .split("③")
      .map(
        (subStr, j) =>
          j % 2 === 1 ? (
            <Icon
              key={"circle3" + j}
              color="orange"
              name="numeric-3-circle"
              size={20}
            />
          ) : (
            this._makeBold(subStr, bold)
          )
      );
  }

  _makeBold(content: string, bold: boolean) {
    return bold ? (
      content
    ) : (
      <SystemText style={this.props.extraBold ? styles.extraBold : styles.bold}>
        {content}
      </SystemText>
    );
  }

  render() {
    return (
      <SystemText
        style={[
          styles.text,
          this.props.bold && styles.bold,
          this.props.center && styles.center,
          this.props.italic && styles.italic,
          this.props.style,
        ]}
        onPress={this.props.onPress}
      >
        {this.props.content
          .split("**")
          .map((str, i) => this._oneReplace(str, 1 % 2 == 1))}
      </SystemText>
    );
  }
}

const styles = StyleSheet.create({
  bold: {
    fontFamily: FONT_BOLD,
  },
  center: {
    textAlign: "center",
  },
  text: {
    color: TEXT_COLOR,
    fontFamily: FONT_NORMAL,
    fontSize: REGULAR_TEXT,
  },
  extraBold: {
    fontFamily: FONT_EXTRA_BOLD,
  },
  italic: {
    fontFamily: FONT_ITALIC,
  },
});
