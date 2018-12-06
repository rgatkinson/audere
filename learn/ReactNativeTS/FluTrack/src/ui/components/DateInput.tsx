import React from "react";
import {
  DatePickerIOS,
  Picker,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { format } from "date-fns";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Modal from "./Modal";

interface Props {
  date: Date | null;
  mode: "day" | "month";
  placeholder: string;
  onDateChange(date: Date): void;
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

class DateInput extends React.Component<Props & WithNamespaces> {
  state = {
    open: false,
    selectedDate: new Date(),
  };

  static getDerivedStateFromProps(props: Props) {
    if (props.date) {
      return { selectedDate: props.date };
    }
    return null;
  }

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
    const { t } = this.props;
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
        <Modal
          height={280}
          width={350}
          submitText={t('common:button:done')}
          visible={this.state.open}
          onDismiss={() => this.setState({ open: false })}
          onSubmit={() => {
            this.props.onDateChange(this.state.selectedDate);
            this.setState({ open: false });
          }}
        >
          {this.props.mode === "day"
            ? <DatePickerIOS
                date={this.state.selectedDate}
                maximumDate={new Date()}
                mode="date"
                onDateChange={(date) => {
                  this.setState({ selectedDate: date })
                }}
                timeZoneOffsetInMinutes={0} // force to UTC
              />
            : <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={months[this.state.selectedDate.getMonth()]}
                  style={{ height: 50, width: 250 }}
                  onValueChange={(month) => {
                    const newDate = new Date(this.state.selectedDate);
                    newDate.setMonth(months.indexOf(month));
                    this.setState({ selectedDate: newDate });
                  }}>
                  {months.map(month => (
                    <Picker.Item label={t(month)} value={month} key={month} />
                  ))}
                </Picker>
                <Picker
                  selectedValue={this.state.selectedDate.getFullYear()}
                  style={{ height: 50, width: 100 }}
                  onValueChange={year => {
                    const newDate = new Date(this.state.selectedDate);
                    newDate.setFullYear(year);
                    this.setState({ selectedDate: newDate });
                  }}>
                  {[...Array(3).keys()].reverse().map(index => {
                    const year = (new Date()).getFullYear() - index;
                    return (
                      <Picker.Item label={'' + year} value={year} key={year} />
                    );
                  })}
                </Picker>
              </View>
          }
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 30,
    marginVertical: 20,
  },
  pickerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
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
