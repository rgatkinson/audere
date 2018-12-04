import React from "react";
import {
  DatePickerIOS,
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
  placeholder: string;
  onDateChange(date: Date): void;
}

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
    return format(new Date(+year, +month - 1, +day), "MMMM D, YYYY");
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
          submitText={t('common:button:done')}
          visible={this.state.open}
          onDismiss={() => this.setState({ open: false })}
          onSubmit={() => {
            // TODO: translate submit text above
            this.props.onDateChange(this.state.selectedDate);
            this.setState({ open: false });
          }}
        >
          <DatePickerIOS
            date={this.state.selectedDate}
            maximumDate={new Date()}
            mode="date"
            onDateChange={(date) => {
              this.setState({ selectedDate: date })
            }}
            timeZoneOffsetInMinutes={0} // force to UTC
          />
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

export default withNamespaces()(DateInput);
