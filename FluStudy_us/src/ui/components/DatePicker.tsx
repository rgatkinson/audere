// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import * as DatePickerComponent from "react-native-datepicker";
import { getAnswer } from "../../util/survey";
import { Action, updateAnswer, StoreState } from "../../store";
import { DateQuestion } from "audere-lib/chillsQuestionConfig";
import {
  BORDER_COLOR,
  GUTTER,
  HIGHLIGHT_STYLE,
  SMALL_TEXT,
  TEXT_COLOR,
} from "../styles";

interface Props {
  date?: Date;
  highlighted?: boolean;
  question: DateQuestion;
  dispatch(action: Action): void;
}

class DatePicker extends React.Component<Props & WithNamespaces> {
  shouldComponentUpdate(props: Props & WithNamespaces) {
    return (
      props.date != this.props.date ||
      props.highlighted != this.props.highlighted ||
      props.question != this.props.question
    );
  }

  _onDateChange = (dateStr: string, date: Date | undefined) => {
    let dateInput;
    if (!!date) {
      dateInput = new Date();
      dateInput.setUTCFullYear(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      dateInput.setUTCHours(0, 0, 0, 0);
    }
    this.props.dispatch(updateAnswer({ dateInput }, this.props.question));
  };

  render() {
    const { date, highlighted, question, t } = this.props;
    let selectedDate;
    if (!!date) {
      selectedDate = new Date(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0,
        0
      );
    }
    return (
      <View
        style={[styles.container, !!highlighted && HIGHLIGHT_STYLE]}
        accessible={true}
        accessibilityLabel={t("selectDate")}
      >
        <DatePickerComponent.default
          date={selectedDate}
          mode="date"
          placeholder={t("selectDate")}
          confirmBtnText={t("common:button:done")}
          cancelBtnText={t("common:button:cancel")}
          format="MMMM D, YYYY"
          minDate={question.minDate}
          maxDate={new Date()}
          onDateChange={this._onDateChange}
          style={{ width: "100%" }}
          customStyles={{
            dateInput: {
              borderWidth: 0,
              alignItems: "flex-start",
              padding: GUTTER / 4,
            },
            dateText: {
              color: TEXT_COLOR,
              fontSize: SMALL_TEXT,
            },
          }}
        />
      </View>
    );
  }
}

export default connect((state: StoreState, props: Props) => ({
  date: getAnswer(state, props.question),
}))(withNamespaces("datePicker")(DatePicker));

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    marginBottom: GUTTER,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER_COLOR,
  },
});
