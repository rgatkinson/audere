// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  Dimensions,
  Picker,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { NavigationScreenProp, withNavigationFocus } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { SurveyQuestionData } from "../../resources/QuestionConfig";
import Modal from "./Modal";
import Text from "./Text";
import {
  BORDER_COLOR,
  HIGHLIGHT_STYLE,
  GUTTER,
  INPUT_HEIGHT,
  LINK_COLOR,
  SECONDARY_COLOR,
} from "../styles";
import { monthAsDate } from "../../util/date";

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
  isFocused: boolean;
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
  shouldComponentUpdate(props: MonthModalProps & WithNamespaces) {
    return props.isFocused;
  }

  state = {
    date: this.props.date,
  };

  _onValueChange = (selected: number | string) => {
    if (selected === this.props.t("selectDate")) {
      this.setState({ date: null });
    } else {
      if (Platform.OS === "android") {
        this.props.onDismiss(new Date(selected));
      }
      this.setState({ date: new Date(selected) });
    }
  };

  _renderPicker() {
    const { t } = this.props;
    const selectDate = t("selectDate");
    return (
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
          <Picker.Item label={selectDate} value={selectDate} key={selectDate} />
        </Picker>
      </View>
    );
  }

  _onCancel = () => {
    this.setState({ date: this.props.date });
    this.props.onDismiss(this.props.date);
  };

  _onSubmit = () => {
    this.props.onDismiss(this.state.date);
  };

  render() {
    const { t, visible } = this.props;
    const { width } = Dimensions.get("window");
    return Platform.OS === "ios" ? (
      <Modal
        height={280}
        width={width * 0.75}
        submitText={t("common:button:done")}
        visible={visible}
        onDismiss={this._onCancel}
        onSubmit={this._onSubmit}
      >
        {this._renderPicker()}
      </Modal>
    ) : (
      this._renderPicker()
    );
  }
}
const TranslatedMonthModal = withNamespaces("monthPicker")(MonthModal);

interface Props {
  highlighted?: boolean;
  isFocused: boolean;
  navigation: NavigationScreenProp<any, any>;
  question: SurveyQuestionData;
  getAnswer(key: string, id: string): any;
  updateAnswer(answer: object, data: SurveyQuestionData): void;
}

class MonthPicker extends React.Component<Props & WithNamespaces> {
  shouldComponentUpdate(props: Props & WithNamespaces) {
    return props.isFocused;
  }

  state = {
    pickerOpen: false,
  };

  _getOptions(): Date[] {
    const startDate = this.props.question.startDate!;
    const endDate = new Date(Date.now());
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
      options.push(monthAsDate(currentYear, currentMonth));
      if (currentMonth < months.length - 1) {
        currentMonth += 1;
      } else {
        currentMonth = 0;
        currentYear++;
      }
    }

    return options;
  }

  _onDateChange = (dateInput: Date | null) => {
    this.setState({ pickerOpen: false });
    this.props.updateAnswer({ dateInput }, this.props.question);
  };

  _openModal = () => {
    this.setState({ pickerOpen: true });
  };

  render() {
    const { highlighted, isFocused, question, t, getAnswer } = this.props;
    const date = getAnswer("dateInput", question.id);

    return (
      <View
        style={[
          { alignSelf: "stretch", marginBottom: GUTTER / 2 },
          !!highlighted && HIGHLIGHT_STYLE,
        ]}
      >
        {Platform.OS === "ios" && (
          <TouchableOpacity
            style={styles.pickerContainer}
            onPress={this._openModal}
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
        )}
        <TranslatedMonthModal
          isFocused={isFocused}
          options={this._getOptions()}
          date={!!date ? date : null}
          visible={this.state.pickerOpen}
          onDismiss={this._onDateChange}
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
export default withNavigationFocus(withNamespaces("monthPicker")(MonthPicker));
