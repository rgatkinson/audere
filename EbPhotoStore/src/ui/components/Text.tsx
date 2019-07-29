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
  GestureResponderEvent
} from "react-native";
import {
  FONT_BOLD,
  FONT_ITALIC,
  FONT_NORMAL,
  LINK_COLOR,
  REGULAR_TEXT,
  TEXT_COLOR
} from "../styles";

interface Props {
  bold?: boolean;
  center?: boolean;
  content: string;
  italic?: boolean;
  style?: StyleProp<TextStyle>;
  onPress?: (event: GestureResponderEvent) => void;
}

export default class Text extends React.PureComponent<Props> {
  _makeBold(content: string, bold: boolean, index: number) {
    return bold ? (
      <SystemText key={index + content} style={styles.bold}>
        {content}
      </SystemText>
    ) : (
      content
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
          style
        ]}
        accessibilityLabel={content}
        onPress={onPress}
      >
        {content
          .split("**")
          .map((str, i) => this._makeBold(str, i % 2 == 1, i))}
      </SystemText>
    );
  }
}

const styles = StyleSheet.create({
  bold: {
    fontWeight: "bold"
  },
  center: {
    textAlign: "center"
  },
  text: {
    color: TEXT_COLOR,
    fontFamily: FONT_NORMAL,
    fontSize: REGULAR_TEXT,
    lineHeight: 22
  },
  italic: {
    fontFamily: FONT_ITALIC
  },
  linkStyle: {
    color: LINK_COLOR,
    fontFamily: FONT_BOLD
  }
});
