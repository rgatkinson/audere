// Custom text component that just adds some default styles to Text -- SO ANNOYING

import React from "react";
import { Text } from "react-native";
import styles from "../Styles";

interface Props {
  style?: any;
}
export default class MyText extends React.Component<Props, any> {
  render() {
    return (
      <Text style={[styles.regularText, this.props.style]}>
        {this.props.children}
      </Text>
    );
  }
}
