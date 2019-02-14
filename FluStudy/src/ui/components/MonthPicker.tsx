import React from "react";
import { Picker } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import BorderView from "./BorderView";

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

interface Props {
  date?: Date;
  onDateChange(date: Date): void;
}

const NUM_OPTIONS = 18;

class MonthPicker extends React.Component<Props & WithNamespaces> {
  _getOptions(): Date[] {
    const options = [];
    const now = new Date();

    let currentMonth = now.getMonth();
    let currentYear = now.getFullYear();
    let count;
    for (count = 0; count < NUM_OPTIONS; count++) {
      options.push(new Date(currentYear, currentMonth));
      currentMonth = currentMonth - 1;
      if (currentMonth == -1) {
        currentMonth = months.length - 1;
        currentYear = currentYear - 1;
      }
    }
    return options.reverse();
  }

  render() {
    const { t } = this.props;
    const now = new Date();
    const value = !!this.props.date
      ? this.props.date.getTime()
      : new Date(now.getFullYear(), now.getMonth()).getTime();
    return (
      <BorderView>
        <Picker
          selectedValue={value}
          style={{ alignSelf: "stretch" }}
          onValueChange={time => this.props.onDateChange(new Date(time))}
        >
          {this._getOptions().map(date => (
            <Picker.Item
              label={t(months[date.getMonth()]) + " " + date.getFullYear()}
              value={date.getTime()}
              key={date.getTime()}
            />
          ))}
        </Picker>
      </BorderView>
    );
  }
}

export default withNamespaces("monthPicker")(MonthPicker);
