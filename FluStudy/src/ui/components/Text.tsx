import React from "react";
import {
  Linking,
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
  LINK_COLOR,
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
  linkStyle?: StyleProp<TextStyle>;
  onPress?: () => any;
}

interface LinkData {
  startIndex: number;
  length: number;
  title: string;
  url: string;
}

function findMarkdownLinks(text: string): LinkData[] {
  const linkRegex = /\[(.+?)\]\((.+?)\)/;
  let toProcess = text;
  let links = [];

  while (toProcess.length > 0) {
    const match = toProcess.match(linkRegex);

    if (match) {
      const startIndex = match["index"]!;
      const length = match[0].length;

      links.push({
        startIndex,
        length,
        title: match[1],
        url: match[2],
      });

      toProcess = toProcess.substr(startIndex + length);
    } else {
      toProcess = "";
    }
  }

  return links;
}

function linkify(
  text: string,
  style?: StyleProp<TextStyle>
): (JSX.Element | string)[] {
  const links = findMarkdownLinks(text);

  if (links.length == 0) {
    return [text];
  }

  let elements: (JSX.Element | string)[] = [];
  let toProcess = text;

  links.forEach(link => {
    // Output whatever precedes the link as a pure string
    if (link.startIndex > 0) {
      elements.push(toProcess.substr(0, link.startIndex));
    }

    // Now the link itself
    elements.push(
      <SystemText
        key={link.url}
        style={style}
        onPress={() => {
          Linking.openURL(link.url);
        }}
      >
        {link.title}
      </SystemText>
    );

    toProcess = toProcess.substr(link.startIndex + link.length);
  });

  // Tack on anything that follows the final link
  if (toProcess.length > 0) {
    elements.push(toProcess);
  }

  return elements;
}

export default class Text extends React.Component<Props> {
  _oneReplace(str: string, bold: boolean, contentKey: string) {
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
            this._twoReplace(subStr, bold, contentKey)
          )
      );
  }

  _twoReplace(str: string, bold: boolean, contentKey: string) {
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
            this._threeReplace(subStr, bold, contentKey)
          )
      );
  }

  _threeReplace(str: string, bold: boolean, contentKey: string) {
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
            this._makeBold(subStr, bold, contentKey)
          )
      );
  }

  _makeBold(content: string, bold: boolean, contentKey: string) {
    return bold ? (
      <SystemText
        key={contentKey + content}
        style={this.props.extraBold ? styles.extraBold : styles.bold}
      >
        {linkify(content, this.props.linkStyle || styles.linkStyle)}
      </SystemText>
    ) : (
      linkify(content, this.props.linkStyle || styles.linkStyle)
    );
  }

  render() {
    return (
      <SystemText
        selectable={true}
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
          .map((str, i) => this._oneReplace(str, i % 2 == 1, i.toString()))}
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
  linkStyle: {
    color: LINK_COLOR,
  },
});
