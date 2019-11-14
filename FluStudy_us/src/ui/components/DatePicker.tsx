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

  _onDateChange = (dateStr: string, dateInput: Date | undefined) => {
    this.props.dispatch(updateAnswer({ dateInput }, this.props.question));
  };

  render() {
    const { date, highlighted, question, t } = this.props;

    return (
      <View style={[styles.container, !!highlighted && HIGHLIGHT_STYLE]}>
        <DatePickerComponent.default
          date={date}
          mode="date"
          placeholder={t("selectDate")}
          confirmBtnText={t("common:button:done")}
          cancelBtnText={t("common:button:cancel")}
          format="YYYY-MM-DD"
          minDate={question.minDate}
          maxDate={new Date(Date.now())}
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
    marginBottom: GUTTER / 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER_COLOR,
  },
});
