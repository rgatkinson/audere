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
              <SystemText key={i + str} style={styles.regular}>
                {str}
              </SystemText>
            ) : (
              <SystemText key={i + str} style={styles.bold}>
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
    fontSize: 21,
    marginVertical: 20,
  },
  center: {
    textAlign: "center",
  },
  regular: {
    fontFamily: "OpenSans-Regular",
  },
});
