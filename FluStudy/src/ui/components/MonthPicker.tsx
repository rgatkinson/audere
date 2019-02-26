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
  startDate: Date;
  endDate: Date;
  onDateChange(date: Date): void;
}

const NUM_OPTIONS = 18;

class MonthPicker extends React.Component<Props & WithNamespaces> {
  _getOptions(): Date[] {
    const options = [];

    let currentMonth = this.props.startDate.getMonth();
    let currentYear = this.props.startDate.getFullYear();
    let endMonth = this.props.endDate.getMonth();
    let endYear = this.props.endDate.getFullYear();

    if (
      endYear < currentYear ||
      (endYear == currentYear && endMonth < currentMonth)
    ) {
      throw new Error("Invalid date range given to MonthPicker");
    }

    while (currentYear < endYear || currentMonth <= endMonth) {
      options.push(new Date(currentYear, currentMonth));
      if (currentMonth < months.length - 1) {
        currentMonth += 1;
      } else {
        currentMonth = 0;
        currentYear++;
      }
    }

    return options;
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
