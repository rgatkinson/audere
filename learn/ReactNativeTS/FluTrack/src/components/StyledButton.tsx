// Custom button that looks like the button on auderenow.org

import React from "react";
import PropTypes from "prop-types";
import { Text, TouchableOpacity } from "react-native";
import styles from "../Styles";

export default class StyledButton extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    onPress: PropTypes.func.isRequired
  };
  render() {
    return (
      <TouchableOpacity
        style={styles.styledButton}
        activeOpacity={0.5}
        onPress={this.props.onPress}
      >
        <Text style={[styles.bold, styles.white]}>{this.props.title}</Text>
      </TouchableOpacity>
    );
  }
}
