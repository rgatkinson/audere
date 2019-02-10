import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text as SystemText,
  TextStyle,
} from "react-native";
import {
  FONT_BOLD,
  FONT_EXTRA_BOLD,
  FONT_NORMAL,
  GUTTER,
  PRIMARY_COLOR,
  REGULAR_TEXT,
} from "../styles";

interface Props {
  bold?: boolean;
  center?: boolean;
  content: string;
  extraBold?: boolean;
  style?: StyleProp<TextStyle>;
}

export default class Text extends React.Component<Props> {
  render() {
    return (
      <SystemText
        style={[
          styles.container,
          this.props.center && styles.center,
          this.props.bold && styles.bold,
          this.props.style,
        ]}
      >
        {this.props.content.split("**").map(
          (str, i) =>
            i % 2 == 0 ? (
              <SystemText key={i + str}>{str}</SystemText>
            ) : (
              <SystemText
                key={i + str}
                style={this.props.extraBold ? styles.extraBold : styles.bold}
              >
                {str}
              </SystemText>
            )
        )}
      </SystemText>
    );
  }
}

const styles = StyleSheet.create({
  bold: {
    fontFamily: FONT_BOLD,
  },
  container: {
    alignSelf: "stretch",
    color: PRIMARY_COLOR,
    fontFamily: FONT_NORMAL,
    fontSize: REGULAR_TEXT,
  },
  extraBold: {
    fontFamily: FONT_EXTRA_BOLD,
  },
  center: {
    textAlign: "center",
  },
});
