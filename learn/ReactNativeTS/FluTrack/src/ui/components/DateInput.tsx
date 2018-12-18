import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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

  //https://github.com/date-fns/date-fns/issues/489
  formatDate(date: Date): string {
    const [year, month, day] = date
      .toISOString()
      .substr(0, 10)
      .split("-");
    return format(
      new Date(+year, +month - 1, +day),
      this.props.mode === "month"
        ? "MMMM YYYY"
        : "MMMM D, YYYY"
    );
  }

  render() {
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
            <Text style={styles.text}>{this.formatDate(this.props.date)}</Text>
          ) : (
            <Text style={styles.text}>
              {this.props.placeholder}
            </Text>
          )}
        </TouchableOpacity>
        <DateModal
          date={date}
          mode={this.props.mode}
          visible={this.state.open}
          onDismiss={(date) => {
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
