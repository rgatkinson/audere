import React from "react";
import { Picker } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import BorderView from "./BorderView";
import { GUTTER, SECONDARY_COLOR } from "../styles";

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

  _getSelectedTime(): number {
    return !!this.props.date
      ? this.props.date.getTime()
      : new Date(
          this.props.endDate.getFullYear(),
          this.props.endDate.getMonth()
        ).getTime();
  }

  componentDidMount() {
    // We need this because by default, Picker doesn't send an onValueChange
    // upon initial render.  So if the user leaves the value at its default
    // selected value, the parent of this component never updates its date
    // otherwise.
    this.props.onDateChange(new Date(this._getSelectedTime()));
  }

  render() {
    const { t } = this.props;
    const now = new Date();
    return (
      <BorderView>
        <Picker
          selectedValue={this._getSelectedTime()}
          style={{
            alignSelf: "stretch",
            height: 140,
            justifyContent: "center",
            overflow: "hidden",
          }}
          onValueChange={time => this.props.onDateChange(new Date(time))}
        >
          {this._getOptions().map(date => (
            <Picker.Item
              color={
                date.getTime() === this._getSelectedTime()
                  ? SECONDARY_COLOR
                  : undefined
              }
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
