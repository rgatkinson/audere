import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text as SystemText,
  TextStyle,
} from "react-native";

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
    fontFamily: "OpenSans-Bold",
  },
  container: {
    color: "#333",
    fontFamily: "OpenSans-Regular",
    fontSize: 14,
    marginVertical: 5,
  },
  extraBold: {
    fontFamily: "OpenSans-ExtraBold",
  },
  center: {
    textAlign: "center",
  },
});
