import React from "react";
import { DatePickerIOS, Picker, StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Modal from "./Modal";

interface Props {
  date: Date;
  mode: "day" | "month";
  visible: boolean;
  onDismiss(date: Date): void;
}

const months = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

class DateModal extends React.Component<Props & WithNamespaces> {
  state = {
    selectedDate: false,
    date: new Date(),
  };

  _getDate = (): Date => {
    return this.state.selectedDate ? this.state.date : this.props.date;
  };

  render() {
    const { t } = this.props;
    return (
      <Modal
        height={280}
        width={350}
        submitText={t("common:button:done")}
        visible={this.props.visible}
        onDismiss={() => this.props.onDismiss(this.props.date)}
        onSubmit={() => this.props.onDismiss(this._getDate())}
      >
        {this.props.mode === "day" ? (
          <DatePickerIOS
            date={this._getDate()}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
            mode="date"
            onDateChange={date => {
              this.setState({ selectedDate: true, date });
            }}
            timeZoneOffsetInMinutes={0} // force to UTC
          />
        ) : (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={months[this._getDate().getMonth()]}
              style={{ height: 50, width: 250 }}
              onValueChange={month => {
                const newDate = new Date(
                  this._getDate().getFullYear(),
                  months.indexOf(month)
                );
                this.setState({ selectedDate: true, date: newDate });
              }}
            >
              {months.map(month => (
                <Picker.Item label={t(month)} value={month} key={month} />
              ))}
            </Picker>
            <Picker
              selectedValue={this._getDate().getFullYear()}
              style={{ height: 50, width: 100 }}
              onValueChange={year => {
                const newDate = new Date(year, this._getDate().getMonth());
                this.setState({ selectedDate: true, date: newDate });
              }}
            >
              {[...Array(2).keys()].reverse().map(index => {
                const year = new Date().getFullYear() - index;
                return (
                  <Picker.Item label={"" + year} value={year} key={year} />
                );
              })}
            </Picker>
          </View>
        )}
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  pickerContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
});

export default withNamespaces("dateModal")(DateModal);
