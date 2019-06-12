// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet } from "react-native";
import { SurveyQuestion } from "../../resources/QuestionConfig";
import { BORDER_COLOR, HIGHLIGHT_STYLE } from "../styles";
import TextInput from "./TextInput";

interface Props {
  highlighted?: boolean;
  question: SurveyQuestion;
  getAnswer(key: string, id: string): any;
  updateAnswer(answer: object, data: SurveyQuestion): void;
}

export default class TextInputQuestion extends React.Component<Props> {
  _onEndEditing = (e: any) => {
    this.props.updateAnswer(
      { textInput: e.nativeEvent.text },
      this.props.question
    );
  };

  render() {
    const { highlighted, question, getAnswer, updateAnswer } = this.props;
    const answer = getAnswer("textInput", question.id);
    return (
      <TextInput
        style={[styles.text, highlighted && HIGHLIGHT_STYLE]}
        placeholder={""}
        returnKeyType="done"
        value={answer}
        onEndEditing={this._onEndEditing}
      />
    );
  }
}

const styles = StyleSheet.create({
  text: {
    height: 50,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER_COLOR,
  },
});
