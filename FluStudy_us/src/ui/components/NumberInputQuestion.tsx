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
import { customRef } from "./CustomRef";

interface Props {
  maxDigits?: number;
  minDigits?: number;
  answer?: string;
  highlighted?: boolean;
  question: TextQuestion;
  dispatch(action: Action): void;
}

interface State {
  text?: string;
}

class NumberInputQuestion extends React.Component<
  Props & WithNamespaces,
  State
> {
  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = { text: this.props.answer };
  }

  _onChangeText = (text: string) => {
    this.setState({ text });
  };

  _onEndEditing = (e: any) => {
    const answer = !!this.state.text ? this.state.text : undefined;
    this.setState({ text: answer });
    this.props.dispatch(
      updateAnswer({ textInput: answer }, this.props.question)
    );
  };

  validate = (): boolean => {
    return (
      (!this.state.text && !this.props.question.required) ||
      !this.props.minDigits ||
      (!!this.state.text && this.props.minDigits <= this.state.text.length)
    );
  };

  render() {
    const { highlighted, maxDigits, question, t } = this.props;
    return (
      <View style={[styles.container, highlighted && HIGHLIGHT_STYLE]}>
        <NumberInput
          placeholder={t("surveyPlaceholder:" + question.placeholder)}
          returnKeyType="done"
          value={this.state.text || ""}
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
}))(withNamespaces()(customRef(NumberInputQuestion)));

const styles = StyleSheet.create({
  container: {
    marginBottom: GUTTER,
  },
});
