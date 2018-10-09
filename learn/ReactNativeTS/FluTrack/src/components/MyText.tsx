// Custom text component that just adds some default styles to Text -- SO ANNOYING

import React from "react";
import { Text } from "react-native";
import styles from "../Styles";

export default class MyText extends React.Component {
  render() {
    return (
      <Text style={[styles.regularText, this.props.style]}>
        {this.props.children}
      </Text>
    );
  }
}
