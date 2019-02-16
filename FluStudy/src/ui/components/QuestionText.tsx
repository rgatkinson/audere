import React from "react";
import { StyleSheet, View } from "react-native";
import Text from "./Text";
import { FONT_BOLD, FONT_ITALIC, GUTTER } from "../styles";

interface Props {
  backgroundColor?: string;
  required?: boolean;
  subtext?: string;
  text: string;
}

export default class QuestionText extends React.Component<Props> {
  render() {
    return (
      <View
        style={[
          styles.container,
          !!this.props.backgroundColor && {
            backgroundColor: this.props.backgroundColor,
          },
        ]}
      >
        <Text
          content={(!!this.props.required ? "* " : "") + this.props.text}
          style={styles.text}
        />
        {!!this.props.subtext && (
          <Text content={this.props.subtext} style={styles.subtext} />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    marginVertical: GUTTER / 2,
  },
  text: {
    fontFamily: FONT_BOLD,
  },
  subtext: {
    fontFamily: FONT_ITALIC,
    marginTop: GUTTER / 2,
  },
});
