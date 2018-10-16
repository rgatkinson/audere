// Radio button adding style to react-native-simple-radio-button

import React from "react";
import RadioForm from "react-native-simple-radio-button";
import styles, { colors } from "../Styles";

interface Props {
  options?: any[];
  initial?: number;
  onPress(arg: any): void;
}
export default class RadioButton extends React.Component<Props, any> {
  render() {
    const defaultOptions = [
      { label: "Yes", value: true },
      { label: "No", value: false },
    ];
    return (
      <RadioForm
        radio_props={
          this.props.options !== undefined ? this.props.options : defaultOptions
        }
        initial={this.props.initial}
        buttonColor={colors.accent}
        selectedButtonColor={colors.accent}
        onPress={this.props.onPress}
      />
    );
  }
}
