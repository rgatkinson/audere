// Checkbox adding style to react-native-check-box

import React from "react";
import { default as TheirDatePicker } from "react-native-datepicker";
import { StyleSheet } from "react-native";

interface Props {
  style?: any;
  date: Date;
  onDateChange(arg: any): void;
}
export default class DatePicker extends React.Component<Props, any> {
  render() {
    return (
      <TheirDatePicker
        style={[styles.datePicker, this.props.style]}
        date={this.props.date}
        mode="date"
        placeholder="select date"
        format="YYYY-MM-DD"
        confirmBtnText="Confirm"
        cancelBtnText="Cancel"
        customStyles={{
          dateIcon: {
            position: "absolute",
            left: 0,
            top: 4,
            marginLeft: 0,
          },
          dateInput: {
            marginLeft: 36,
          },
        }}
        onDateChange={this.props.onDateChange}
      />
    );
  }
}

const styles = StyleSheet.create({
  datePicker: {
    width: 200,
    marginBottom: 10,
  },
});
