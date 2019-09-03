// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  Dimensions,
  Picker,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Modal from "./Modal";
import Text from "./Text";
import {
  BORDER_COLOR,
  GUTTER,
  INPUT_HEIGHT,
  LINK_COLOR,
  SECONDARY_COLOR,
} from "../styles";

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

interface MonthModalProps {
  date: Date | null;
  options: Date[];
  visible: boolean;
  onDismiss(date: Date | null): void;
}

interface MonthModalState {
  date: Date | null;
}

class MonthModal extends React.Component<
  MonthModalProps & WithNamespaces,
  MonthModalState
> {
  state = {
    date: this.props.date,
  };

  _onValueChange = (selected: number | string) => {
    if (selected === this.props.t("selectDate")) {
      this.setState({ date: null });
    } else {
      this.setState({ date: new Date(selected) });
    }
  };

  render() {
    const { t } = this.props;
    const { width } = Dimensions.get("window");
    const selectDate = t("selectDate");
    return (
      <Modal
        height={280}
        width={width * 0.75}
        submitText={t("common:button:done")}
        visible={this.props.visible}
        onDismiss={() => this.props.onDismiss(this.props.date)}
        onSubmit={() => this.props.onDismiss(this.state.date)}
      >
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Picker
            selectedValue={
              this.state.date ? this.state.date!.getTime() : selectDate
            }
            style={{ alignSelf: "stretch", justifyContent: "center" }}
            onValueChange={this._onValueChange}
          >
            {this.props.options.map(date => (
              <Picker.Item
                label={t(months[date.getMonth()]) + " " + date.getFullYear()}
                value={date.getTime()}
                key={date.getTime()}
              />
            ))}
            <Picker.Item
              label={selectDate}
              value={selectDate}
              key={selectDate}
            />
          </Picker>
        </View>
      </Modal>
    );
  }
}
const TranslatedMonthModal = withNamespaces("monthPicker")(MonthModal);

interface Props {
  date?: Date;
  startDate: Date;
  endDate: Date;
  onDateChange(date: Date | null): void;
}

class MonthPicker extends React.Component<Props & WithNamespaces> {
  state = {
    pickerOpen: false,
  };

  _getOptions(): Date[] {
    const { endDate, startDate } = this.props;
    const options = [];

    let currentMonth = startDate.getMonth();
    let currentYear = startDate.getFullYear();
    let endMonth = endDate.getMonth();
    let endYear = endDate.getFullYear();

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
    const { date, onDateChange, t } = this.props;
    const now = new Date();

    return (
      <View style={{ alignSelf: "stretch", marginBottom: GUTTER / 2 }}>
        <TouchableOpacity
          style={styles.pickerContainer}
          onPress={() => this.setState({ pickerOpen: true })}
        >
          <Text
            content={
              !!date
                ? t(months[date.getMonth()]) + " " + date.getFullYear()
                : t("selectDate")
            }
            style={{ color: !!date ? SECONDARY_COLOR : LINK_COLOR }}
          />
        </TouchableOpacity>
        <TranslatedMonthModal
          options={this._getOptions()}
          date={!!date ? date : null}
          visible={this.state.pickerOpen}
          onDismiss={(date: Date | null) => {
            this.setState({ pickerOpen: false });
            onDateChange(date);
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  pickerContainer: {
    borderBottomColor: BORDER_COLOR,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flex: 1,
    height: INPUT_HEIGHT,
    justifyContent: "center",
    padding: GUTTER / 4,
  },
});
export default withNamespaces("monthPicker")(MonthPicker);
