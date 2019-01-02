import React from "react";
import { StyleProp, StyleSheet, Text, ViewStyle } from "react-native";

interface Props {
  content: string;
  center?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default class Description extends React.Component<Props> {
  render() {
    return (
      <Text
        style={[
          styles.container,
          this.props.center && styles.center,
          this.props.style,
        ]}
      >
        {this.props.content.split("**").map(
          (str, i) =>
            i % 2 == 0 ? (
              <Text key={i + str} style={styles.description}>
                {str}
              </Text>
            ) : (
              <Text key={i + str} style={styles.bold}>
                {str}
              </Text>
            )
        )}
      </Text>
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
    letterSpacing: -0.51,
    lineHeight: 26,
  },
  center: {
    textAlign: "center",
  },
  description: {
    fontFamily: "OpenSans-Regular",
  },
});
