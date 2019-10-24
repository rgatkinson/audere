// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { Action, updateAnswer, StoreState } from "../../store";
import { getAnswer } from "../../util/survey";
import { TextQuestion } from "audere-lib/chillsQuestionConfig";
import { GUTTER, HIGHLIGHT_STYLE } from "../styles";
import NumberInput from "./NumberInput";

interface Props {
  maxDigits?: number;
  answer?: string;
  highlighted?: boolean;
  question: TextQuestion;
  dispatch(action: Action): void;
}

class NumberInputQuestion extends React.Component<Props & WithNamespaces> {
  state = { text: this.props.answer };

  _onChangeText = (text: string) => {
    this.setState({ text });
  };

  _onEndEditing = (e: any) => {
    this.props.dispatch(
      updateAnswer(
        { numberInput: +(this.state.text || 0) },
        this.props.question
      )
    );
  };

  render() {
    const { highlighted, maxDigits, question, t } = this.props;
    return (
      <View style={[styles.container, highlighted && HIGHLIGHT_STYLE]}>
        <NumberInput
          placeholder={t("surveyPlaceholder:" + question.placeholder)}
          returnKeyType="done"
          value={(this.state.text || "").toString()}
          onChangeText={this._onChangeText}
          onEndEditing={this._onEndEditing}
          maxDigits={maxDigits}
        />
      </View>
    );
  }
}
export default connect((state: StoreState, props: Props) => ({
  answer: getAnswer(state, props.question),
}))(withNamespaces()(NumberInputQuestion));

const styles = StyleSheet.create({
  container: {
    marginBottom: GUTTER / 2,
  },
});
