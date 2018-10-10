// Label that goes to the left of an input field, on same row
// Usage: Pass the actual input field through as child element

import React from "react";
import PropTypes from "prop-types";
import { StyleSheet, Text, View } from "react-native";
import MyText from "./MyText";
import styles from "../Styles";

export default class FieldLabel extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired
  };
  render() {
    return (
      <View style={styles.flexRow}>
        <MyText style={styles.fieldLabel}>{this.props.label}</MyText>
        {this.props.children}
      </View>
    );
  }
}
