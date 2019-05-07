// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { format } from "date-fns";
import { WithNamespaces, withNamespaces } from "react-i18next";
import DateModal from "./DateModal";
import { LocaleConfig } from "../../i18n/LocaleConfig";

interface Props {
  date: Date | null;
  defaultYear: number | null;
  mode: "day" | "month";
  placeholder: string;
  onDateChange(date: Date): void;
}

class DateInput extends React.Component<Props & WithNamespaces> {
  state = {
    open: false,
  };

  formatDate(date: Date, language: string): string {
    //https://github.com/date-fns/date-fns/issues/489
    const [year, month, day] = date
      .toISOString()
      .substr(0, 10)
      .split("-");
    const realDate = new Date(+year, +month - 1, +day);
    return format(
      realDate,
      this.props.mode === "month"
        ? LocaleConfig[language].monthFormat
        : LocaleConfig[language].dateFormat,
      {
        locale: LocaleConfig[language].dateLocale,
      }
    );
  }

  render() {
    const { i18n } = this.props;
    const newDate = new Date();
    if (!!this.props.defaultYear) {
      newDate.setFullYear(this.props.defaultYear);
    }
    const date = !!this.props.date ? this.props.date : newDate;
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.textContainer}
          onPress={() => this.setState({ open: true })}
        >
          {this.props.date ? (
            <Text style={styles.text}>
              {this.formatDate(this.props.date, i18n.language)}
            </Text>
          ) : (
            <Text style={styles.text}>{this.props.placeholder}</Text>
          )}
        </TouchableOpacity>
        <DateModal
          date={date}
          mode={this.props.mode}
          visible={this.state.open}
          onDismiss={date => {
            this.setState({ open: false });
            this.props.onDateChange(date);
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 30,
    marginVertical: 20,
  },
  textContainer: {
    alignSelf: "stretch",
    borderBottomColor: "#bbb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 30,
  },
  text: {
    color: "#007AFF",
    fontFamily: "OpenSans-Regular",
    fontSize: 17,
    paddingHorizontal: 16,
    letterSpacing: -0.41,
    lineHeight: 22,
  },
});

export default withNamespaces("dateInput")(DateInput);
