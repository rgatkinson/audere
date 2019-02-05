import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { format } from "date-fns";
import { WithNamespaces, withNamespaces } from "react-i18next";
import DateModal from "./DateModal";

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
    //No built-in library for locale-sensitive month+year, specify patterns here
    const locales: {
      [index: string]: { locale: any; monthFormat: string };
    } = {
      en: { locale: require("date-fns/locale/en"), monthFormat: "MMMM YYYY" },
      es: {
        locale: require("date-fns/locale/es"),
        monthFormat: "MMMM [de] YYYY",
      },
    };
    //https://github.com/date-fns/date-fns/issues/489
    const [year, month, day] = date
      .toISOString()
      .substr(0, 10)
      .split("-");
    const realDate = new Date(+year, +month - 1, +day);
    const options = { year: "numeric", month: "long", day: "numeric" };
    return this.props.mode === "month"
      ? format(realDate, locales[language].monthFormat, {
          locale: locales[language].locale,
        })
      : date.toLocaleDateString(language, options);
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
