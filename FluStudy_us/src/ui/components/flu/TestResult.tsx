import React, { Fragment } from "react";
import { StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { Action, StoreState, setResultShown } from "../../../store";
import {
  getSelectedButton,
  getAnswer,
  getAnswerForID,
} from "../../../util/survey";
import {
  PinkWhenBlueConfig,
  WhatSymptomsConfig,
} from "audere-lib/chillsQuestionConfig";
import BorderView from "../BorderView";
import { BulletPoint } from "../BulletPoint";
import Divider from "../Divider";
import Text from "../Text";
import {
  getExplanationRedAnswer,
  getResultRedAnswer,
} from "../../../util/fluResults";
import { GUTTER } from "../../styles";
import CollapsibleText from "../CollapsibleText";
import { AppEvents } from "../../../util/tracker";

interface Props {
  hasNoSymptoms4Days: boolean;
  redAnswer?: string;
  dispatch(action: Action): void;
}

class TestResult extends React.Component<Props & WithNamespaces> {
  componentDidMount() {
    const { dispatch, redAnswer, t } = this.props;
    if (!!redAnswer) {
      dispatch(
        setResultShown(
          getResultRedAnswer(redAnswer),
          t(getExplanationRedAnswer(redAnswer))
        )
      );
    }
  }

  render() {
    const { hasNoSymptoms4Days, redAnswer, t } = this.props;
    const result = getResultRedAnswer(redAnswer);
    const showNegativeExplanation = result === "negative";
    return (
      <Fragment>
        {!showNegativeExplanation && (
          <Fragment>
            <Text content={t("common:testResult:desc")} />
            <BorderView style={styles.border}>
              <Text center={true} content={t(`common:testResult:${result}`)} />
            </BorderView>
          </Fragment>
        )}
        {showNegativeExplanation && (
          <Text
            style={styles.resultText}
            content={
              t("common:testResult:descNegative") +
              t(`common:testResult:${result}`)
            }
          />
        )}
        <Text content={t("common:testResult:whyTitle")} style={styles.text} />
        <Text content={t("why")} style={styles.text} />
        <View style={{ marginHorizontal: GUTTER }}>
          <BulletPoint
            content={t("common:testResult:blueLine")}
            customBulletUri="listarrow"
          />
          <BulletPoint
            content={t(getExplanationRedAnswer(redAnswer))}
            customBulletUri="listarrow"
          />
        </View>
        {showNegativeExplanation && (
          <Fragment>
            <Text content={t("common:testResult:negativeExplanation")} />
            <View style={{ marginHorizontal: GUTTER }}>
              <BulletPoint
                content={t("common:testResult:negativeExplanationBullet")}
                customBulletUri="listarrow"
              />
              <BulletPoint
                content={t(
                  hasNoSymptoms4Days
                    ? "common:testResult:negativeExplanationBulletAllUnder4Days"
                    : "common:testResult:negativeExplanationBulletOne4Days"
                )}
                customBulletUri="listarrow"
              />
            </View>
          </Fragment>
        )}

        <Divider />
        <CollapsibleText
          content={
            t(`common:testResult:${result}++WhatToDo`) +
            ` ${t("common:testResult:whatToDoCommon")}`
          }
          appEvent={AppEvents.WHAT_TO_DO_WITH_TEST_RESULT_PRESSED}
        />
      </Fragment>
    );
  }
}

export default connect((state: StoreState) => ({
  redAnswer: getSelectedButton(state, PinkWhenBlueConfig),
  hasNoSymptoms4Days:
    getAnswer(state, WhatSymptomsConfig)
      .filter((item: any) => {
        if (item.selected) return item;
      })
      .map((question: any) => {
        return getAnswerForID(
          state,
          `SymptomsStart_${question.key}`,
          "selectedButtonKey"
        );
      })
      .filter((frequency: string) => {
        if (frequency == "4days") return frequency;
      }).length === 0,
}))(withNamespaces("TestResult")(TestResult));

const styles = StyleSheet.create({
  border: {
    borderRadius: 10,
    paddingVertical: GUTTER,
    margin: GUTTER,
  },
  resultText: {
    marginBottom: GUTTER,
  },
  text: {
    alignSelf: "stretch",
    marginBottom: GUTTER,
  },
});
