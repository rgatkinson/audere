import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text as SystemText,
  TextStyle,
} from "react-native";

interface Props {
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
    alignSelf: "stretch",
    fontFamily: "OpenSans-Regular",
    fontSize: 21,
    marginVertical: 10,
  },
  extraBold: {
    fontFamily: "OpenSans-ExtraBold",
  },
  center: {
    textAlign: "center",
  },
});
