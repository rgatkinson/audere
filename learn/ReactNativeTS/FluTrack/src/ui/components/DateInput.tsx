import React from "react";
import {
  DatePickerIOS,
  LayoutAnimation,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { format } from "date-fns";
import { WithNamespaces, withNamespaces } from "react-i18next";

interface Props {
  autoFocus: boolean;
  date: Date | null;
  placeholder: string;
  onDateChange(date: Date): void;
}

export default class DateInput extends React.Component<Props> {
  state = {
    open: false,
  };

  componentWillMount() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    this.setState({ open: this.props.autoFocus });
  }
  //https://github.com/date-fns/date-fns/issues/489
  formatDate(date: Date): string {
    const [year, month, day] = date
      .toISOString()
      .substr(0, 10)
      .split("-");
    return format(new Date(+year, +month - 1, +day), "MMMM D, YYYY");
  }

  render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.textContainer}
          onPress={() => this.setState({ open: true })}
        >
          {this.props.date ? (
            <Text style={styles.text}>{this.formatDate(this.props.date)}</Text>
          ) : (
            <Text style={[styles.text, styles.placeholder]}>
              {this.props.placeholder}
            </Text>
          )}
        </TouchableOpacity>
        {this.state.open ? (
          <TranslatedPicker
            date={this.props.date ? this.props.date : new Date()}
            closePicker={date => {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut
              );
              this.props.onDateChange(date);
              this.setState({ open: false });
            }}
            onDateChange={date => this.props.onDateChange(date)}
          />
        ) : null}
      </View>
    );
  }
}

interface PickerProps {
  date: Date;
  closePicker(date: Date): void;
  onDateChange(date: Date): void;
}

class Picker extends React.Component<PickerProps & WithNamespaces> {
  componentWillMount() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }

  render() {
    return (
      <View style={styles.pickerContainer}>
        <DatePickerIOS
          date={this.props.date}
          maximumDate={new Date()}
          mode="date"
          style={styles.picker}
          onDateChange={this.props.onDateChange}
          timeZoneOffsetInMinutes={0} // force to UTC
        />
        <TouchableOpacity
          style={styles.actionContainer}
          onPress={() => this.props.closePicker(this.props.date)}
        >
          <Text style={styles.actionText}>
            {this.props.t("common:button:select")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  actionContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 50,
  },
  actionText: {
    fontFamily: "System",
    fontSize: 17,
    color: "#007AFF",
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  container: {
    marginHorizontal: 30,
    marginVertical: 20,
  },
  picker: {
    flex: 1,
    paddingHorizontal: 50,
  },
  pickerContainer: {
    flexDirection: "row",
  },
  textContainer: {
    alignSelf: "stretch",
    borderBottomColor: "#bbb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 30,
  },
  placeholder: {
    color: "#8E8E93",
  },
  text: {
    fontFamily: "OpenSans-Regular",
    fontSize: 17,
    paddingHorizontal: 16,
    letterSpacing: -0.41,
    lineHeight: 22,
  },
});

const TranslatedPicker = withNamespaces()<PickerProps>(Picker);
