// Label that goes to the left of an input field, on same row
// Usage: Pass the actual input field through as child element

import React from "react";
import { StyleSheet, View } from "react-native";
import MyText from "./MyText";

interface Props {
  label: string;
}
export default class FieldLabel extends React.Component<Props, any> {
  render() {
    return (
      <View style={styles.flexRow}>
        <MyText style={styles.fieldLabel}>{this.props.label}</MyText>
        {this.props.children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  fieldLabel: {
    width: 100
  },
  flexRow: {
    flexDirection: "row",
    justifyContent: "flex-start"
  }
});
