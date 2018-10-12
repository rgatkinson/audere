// Checkbox adding style to react-native-check-box

import React from "react";
import { default as TheirCheckBox } from "react-native-check-box";
import { StyleSheet } from "react-native";

interface Props {
  style?: any;
  text: string;
  onClick(): void;
  isChecked?: boolean;
}
export default class CheckBox extends React.Component<Props, any> {
  render() {
    return (
      <TheirCheckBox
        style={[styles.checkbox, this.props.style]}
        onClick={this.props.onClick}
        isChecked={this.props.isChecked}
        rightText={this.props.text}
      />
    );
  }
}

const styles = StyleSheet.create({
  checkbox: {
    padding: 10,
    width: 300
  }
});
