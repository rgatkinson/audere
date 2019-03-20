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

    return (
      <View style={{ alignSelf: "stretch", marginBottom: GUTTER / 2 }}>
        <TouchableOpacity
          style={styles.pickerContainer}
          onPress={() => this.setState({ pickerOpen: true })}
        >
          <Text
            content={
              !!this.props.date
                ? t(months[this.props.date.getMonth()]) +
                  " " +
                  this.props.date.getFullYear()
                : t("selectDate")
            }
            style={{ color: !!this.props.date ? SECONDARY_COLOR : LINK_COLOR }}
          />
        </TouchableOpacity>
        <TranslatedMonthModal
          options={this._getOptions()}
          date={!!this.props.date ? this.props.date : null}
          visible={this.state.pickerOpen}
          onDismiss={(date: Date | null) => {
            this.setState({ pickerOpen: false });
            this.props.onDateChange(date);
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
