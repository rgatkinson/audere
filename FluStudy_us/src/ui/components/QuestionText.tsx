// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Text from "./Text";
import { ERROR_COLOR, FONT_BOLD, FONT_ITALIC, GUTTER } from "../styles";
import { SurveyQuestion } from "audere-lib/chillsQuestionConfig";

interface Props {
  question: SurveyQuestion;
  textVariables: any;
}

class QuestionText extends React.Component<Props & WithNamespaces> {
  shouldComponentUpdate(props: Props & WithNamespaces) {
    return (
      props.question != this.props.question ||
      props.textVariables != this.props.textVariables
    );
  }

  render() {
    const { question, t } = this.props;
    const description = t(
      "surveyDescription:" + question.description,
      this.props.textVariables
    );
    const content = !!question.subquestion
      ? description
      : t("surveyTitle:" + question.title, this.props.textVariables);

    return (
      <View style={styles.container}>
        <View style={styles.textContainer}>
          {!question.subquestion && !!question.required && (
            <Text content="* " style={[styles.text, { color: ERROR_COLOR }]} />
          )}
          <Text content={content} style={styles.text} />
        </View>
        {!question.subquestion && !!question.description && (
          <Text content={description} style={styles.subtext} />
        )}
      </View>
    );
  }
}

export default withNamespaces()(QuestionText);

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    marginVertical: GUTTER / 2,
  },
  textContainer: {
    alignSelf: "stretch",
    flexDirection: "row",
  },
  text: {
    fontFamily: FONT_BOLD,
  },
  subtext: {
    fontFamily: FONT_ITALIC,
    marginTop: GUTTER / 2,
  },
});
