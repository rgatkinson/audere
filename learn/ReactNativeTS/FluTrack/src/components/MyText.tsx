// Custom text component that just adds some default styles to Text -- SO ANNOYING

import React from "react";
import PropTypes from "prop-types";
import { Text } from "react-native";
import styles from "../Styles";

export default class MyText extends React.Component {
  static propTypes = {
    style: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.number,
      PropTypes.shape({})
    ])
  };
  render() {
    return (
      <Text style={[styles.regularText, this.props.style]}>
        {this.props.children}
      </Text>
    );
  }
}
