import React from "react";
import {
  Linking,
  StyleProp,
  StyleSheet,
  Text as SystemText,
  TextStyle,
} from "react-native";
import { Svg } from "expo";
import {
  FONT_BOLD,
  FONT_EXTRA_BOLD,
  FONT_ITALIC,
  FONT_NORMAL,
  LINK_COLOR,
  REGULAR_TEXT,
  TEXT_COLOR,
} from "../styles";
import i18next from "i18next";

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
    return str.split("①").map(
      (subStr, j) =>
        j % 2 === 1 ? (
          <Svg key={"circle1" + j} height={18} width={18}>
            <Svg.Circle cx={9} cy={9} r={9} fill="#abca3f" />
            <Svg.Path d="M10.79,14.77H8.51V6L5.78,6.8V4.94l4.77-1.71h.24Z" />
          </Svg>
        ) : (
          this._twoReplace(subStr, bold, contentKey)
        )
    );
  }

  _twoReplace(str: string, bold: boolean, contentKey: string) {
    return str.split("②").map(
      (subStr, j) =>
        j % 2 === 1 ? (
          <Svg key={"circle2" + j} height={18} width={18}>
            <Svg.Circle cx={9} cy={9} r={9} fill="black" />
            <Svg.Path
              d="M13.06,14.84H5.17V13.27l3.72-4A10,10,0,0,0,10,7.84a2.41,2.41,0,0,0,.37-1.19A1.78,1.78,0,0,0,10,5.44,1.41,1.41,0,0,0,8.9,5a1.49,1.49,0,0,0-1.22.53,2.1,2.1,0,0,0-.45,1.4H4.94A3.82,3.82,0,0,1,5.44,5,3.51,3.51,0,0,1,6.86,3.66a4.32,4.32,0,0,1,2.08-.5A4.05,4.05,0,0,1,11.7,4a3,3,0,0,1,1,2.41,3.93,3.93,0,0,1-.44,1.74,9.61,9.61,0,0,1-1.52,2.06L8.11,13h5Z"
              fill="white"
            />
          </Svg>
        ) : (
          this._threeReplace(subStr, bold, contentKey)
        )
    );
  }

  _threeReplace(str: string, bold: boolean, contentKey: string) {
    return str.split("③").map(
      (subStr, j) =>
        j % 2 === 1 ? (
          <Svg key={"circle3" + j} height={18} width={18}>
            <Svg.Circle cx={9} cy={9} r={9} fill="#ef5253" />
            <Svg.Path d="M7.6,8H8.82a1.72,1.72,0,0,0,1.29-.44,1.58,1.58,0,0,0,.42-1.15,1.41,1.41,0,0,0-.42-1.09A1.62,1.62,0,0,0,9,4.93a1.69,1.69,0,0,0-1.1.36,1.16,1.16,0,0,0-.44.93H5.14a2.81,2.81,0,0,1,.49-1.61A3.22,3.22,0,0,1,7,3.49a4.54,4.54,0,0,1,1.93-.41A4.25,4.25,0,0,1,11.78,4a3,3,0,0,1,1,2.41,2.37,2.37,0,0,1-.49,1.45,3.17,3.17,0,0,1-1.26,1A2.7,2.7,0,0,1,13,11.53,3,3,0,0,1,11.88,14a4.48,4.48,0,0,1-3,.93A4.3,4.3,0,0,1,6.1,14,3,3,0,0,1,5,11.6H7.29a1.33,1.33,0,0,0,.48,1.06,1.79,1.79,0,0,0,1.2.41,1.79,1.79,0,0,0,1.28-.43,1.47,1.47,0,0,0,.46-1.14c0-1.15-.63-1.72-1.9-1.72H7.6Z" />
          </Svg>
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
    const content = this.props.content.replace(
      "$$$",
      i18next.t("common:giftCardAmount")
    );
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
        {content
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
