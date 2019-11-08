// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  Linking,
  Platform,
  StyleProp,
  StyleSheet,
  Text as SystemText,
  TextStyle,
  Image,
  GestureResponderEvent,
} from "react-native";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import { Svg } from "expo";
import { textActions } from "../../resources/TextConfig";
import {
  FONT_BOLD,
  FONT_EXTRA_BOLD,
  FONT_ITALIC,
  FONT_NORMAL,
  LINK_COLOR,
  REGULAR_TEXT,
  TEXT_COLOR,
} from "../styles";
import { logFirebaseEvent, AppEvents } from "../../util/tracker";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  bold?: boolean;
  center?: boolean;
  content: string;
  extraBold?: boolean;
  italic?: boolean;
  style?: StyleProp<TextStyle>;
  linkStyle?: StyleProp<TextStyle>;
  onPress?: (event: GestureResponderEvent) => void;
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

const textActionLink = (
  link: LinkData,
  navigation: NavigationScreenProp<any, any>,
  style?: StyleProp<TextStyle>
) => {
  const onPress = () => {
    logFirebaseEvent(AppEvents.LINK_PRESSED, { link: link.title });
    const separatorPos = link.url.indexOf(":");
    let url = link.url;
    if (separatorPos > 0) {
      url = link.url.substr(0, separatorPos);
    }
    if (textActions.hasOwnProperty(url)) {
      (textActions as any)[url](
        link.title,
        navigation,
        separatorPos > 0 ? link.url.substr(separatorPos + 1) : undefined
      );
    } else {
      Linking.openURL(link.url);
    }
  };

  return (
    <SystemText key={link.url} style={style} onPress={onPress}>
      {link.title}
    </SystemText>
  );
};

function linkify(
  text: string,
  navigation: NavigationScreenProp<any, any>,
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
    elements.push(textActionLink(link, navigation, style));

    toProcess = toProcess.substr(link.startIndex + link.length);
  });

  // Tack on anything that follows the final link
  if (toProcess.length > 0) {
    elements.push(toProcess);
  }

  return elements;
}

interface CircleConfig {
  circleFillColor: string;
  pathFillColor?: string;
  svgPath: string;
}

const circleConfigs: Map<string, CircleConfig> = new Map<string, CircleConfig>([
  [
    "①",
    {
      circleFillColor: "#abca3f",
      svgPath: "M10.79,14.77H8.51V6L5.78,6.8V4.94l4.77-1.71h.24Z",
    },
  ],
  [
    "②",
    {
      circleFillColor: "black",
      pathFillColor: "white",
      svgPath:
        "M13.06,14.84H5.17V13.27l3.72-4A10,10,0,0,0,10,7.84a2.41,2.41,0,0,0,.37-1.19A1.78,1.78,0,0,0,10,5.44,1.41,1.41,0,0,0,8.9,5a1.49,1.49,0,0,0-1.22.53,2.1,2.1,0,0,0-.45,1.4H4.94A3.82,3.82,0,0,1,5.44,5,3.51,3.51,0,0,1,6.86,3.66a4.32,4.32,0,0,1,2.08-.5A4.05,4.05,0,0,1,11.7,4a3,3,0,0,1,1,2.41,3.93,3.93,0,0,1-.44,1.74,9.61,9.61,0,0,1-1.52,2.06L8.11,13h5Z",
    },
  ],
  [
    "③",
    {
      circleFillColor: "#ef5253",
      svgPath:
        "M7.6,8H8.82a1.72,1.72,0,0,0,1.29-.44,1.58,1.58,0,0,0,.42-1.15,1.41,1.41,0,0,0-.42-1.09A1.62,1.62,0,0,0,9,4.93a1.69,1.69,0,0,0-1.1.36,1.16,1.16,0,0,0-.44.93H5.14a2.81,2.81,0,0,1,.49-1.61A3.22,3.22,0,0,1,7,3.49a4.54,4.54,0,0,1,1.93-.41A4.25,4.25,0,0,1,11.78,4a3,3,0,0,1,1,2.41,2.37,2.37,0,0,1-.49,1.45,3.17,3.17,0,0,1-1.26,1A2.7,2.7,0,0,1,13,11.53,3,3,0,0,1,11.88,14a4.48,4.48,0,0,1-3,.93A4.3,4.3,0,0,1,6.1,14,3,3,0,0,1,5,11.6H7.29a1.33,1.33,0,0,0,.48,1.06,1.79,1.79,0,0,0,1.2.41,1.79,1.79,0,0,0,1.28-.43,1.47,1.47,0,0,0,.46-1.14c0-1.15-.63-1.72-1.9-1.72H7.6Z",
    },
  ],
]);

class Text extends React.PureComponent<Props> {
  _makeCircle(character: string) {
    const config = circleConfigs.get(character);
    if (config == null) {
      return null;
    }

    if (Platform.OS === "android") {
      let uri = "";

      switch (character) {
        case "①":
          uri = "one";
          break;
        case "②":
          uri = "two";
          break;
        case "③":
          uri = "three";
          break;
        default:
          break;
      }

      return (
        <Image
          source={{ uri }}
          style={{ height: REGULAR_TEXT, width: REGULAR_TEXT }}
        />
      );
    }

    return (
      <Svg height={REGULAR_TEXT} width={REGULAR_TEXT}>
        <Svg.Circle
          cx={REGULAR_TEXT / 2}
          cy={REGULAR_TEXT / 2}
          r={REGULAR_TEXT / 2}
          fill={config.circleFillColor}
        />
        <Svg.Path d={config.svgPath} fill={config.pathFillColor} />
      </Svg>
    );
  }

  _circleRep(str: string, bold: boolean, contentKey: string) {
    return str.split(/(?=①|②|③#?)/g).map((subStr, j) => {
      if (j == 0) {
        return this._makeBold(subStr, bold, contentKey);
      } else {
        return (
          <SystemText key={subStr}>
            {this._makeCircle(subStr.substring(0, 1))}
            {this._makeBold(subStr.substring(1), bold, contentKey)}
          </SystemText>
        );
      }
    });
  }

  _makeBold(content: string, bold: boolean, contentKey: string) {
    const { extraBold, linkStyle, navigation } = this.props;
    return bold ? (
      <SystemText
        key={contentKey + content}
        style={extraBold ? styles.extraBold : styles.bold}
      >
        {linkify(content, navigation, linkStyle || styles.linkStyle)}
      </SystemText>
    ) : (
      linkify(content, navigation, linkStyle || styles.linkStyle)
    );
  }

  render() {
    const { bold, center, content, italic, style, onPress } = this.props;
    return (
      <SystemText
        selectable={true}
        style={[
          styles.text,
          bold && styles.bold,
          center && styles.center,
          italic && styles.italic,
          style,
        ]}
        accessibilityLabel={content}
        onPress={onPress}
      >
        {content
          .split("**")
          .map((str, i) =>
            this._circleRep(str.replace(/\/\*/g, "*"), i % 2 == 1, i.toString())
          )}
      </SystemText>
    );
  }
}

export default withNavigation(Text);

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
    lineHeight: 26,
  },
  extraBold: {
    fontFamily: FONT_EXTRA_BOLD,
  },
  italic: {
    fontFamily: FONT_ITALIC,
  },
  linkStyle: {
    color: LINK_COLOR,
    fontFamily: FONT_BOLD,
  },
});
