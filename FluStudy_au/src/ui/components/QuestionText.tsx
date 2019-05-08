// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet, View } from "react-native";
import Text from "./Text";
import { ERROR_COLOR, FONT_BOLD, FONT_ITALIC, GUTTER } from "../styles";

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
        <View style={{ flexDirection: "row", alignSelf: "stretch" }}>
          {!!this.props.required && (
            <Text content="* " style={[styles.text, { color: ERROR_COLOR }]} />
          )}
          <Text content={this.props.text} style={styles.text} />
        </View>
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
