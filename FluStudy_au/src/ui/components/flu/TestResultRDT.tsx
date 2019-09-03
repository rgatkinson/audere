import React, { Fragment } from "react";
import { StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import {
  Action,
  setRDTInterpretationShown,
  setResultShown,
  StoreState,
} from "../../../store";
import {
  getSelectedButton,
  getAnswer,
  getAnswerForID,
} from "../../../util/survey";
import {
  NumLinesSeenConfig,
  PinkWhenBlueConfig,
  WhatSymptomsConfig,
} from "audere-lib/coughQuestionConfig";
import BorderView from "../BorderView";
import { BulletPoint } from "../BulletPoint";
import Divider from "../Divider";
import Text from "../Text";
import {
  getResultRedAnswer,
  getExplanationRedAnswer,
  isShowRDTInterpretationOfType,
} from "../../../util/fluResults";
import { GUTTER } from "../../styles";
import { getRemoteConfig } from "../../../util/remoteConfig";
import {
  logFirebaseEvent,
  AppEvents,
  RDTInterpretationEventTypes,
} from "../../../util/tracker";
import { RDTReaderResult } from "audere-lib/coughProtocol";
import CollapsibleText from "../CollapsibleText";

interface Props {
  hasNoSymptoms4Days: boolean;
  numLinesAnswer?: string;
  redAnswer?: string;
  readerResult?: RDTReaderResult;
  dispatch(action: Action): void;
}

class TestResultRDT extends React.Component<Props & WithNamespaces> {
  componentDidMount() {
    const interpreter = RDTInterpretationEventTypes.UBICOMP;
    logFirebaseEvent(AppEvents.SHOWED_RDT_INTERPRETATION, { interpreter });
    this.props.dispatch(setRDTInterpretationShown(interpreter));

    const { dispatch, redAnswer, t } = this.props;
    if (!!redAnswer) {
      dispatch(setResultShown(this._getResult(), t(this._getExplanation())));
    }
  }

  _getResult = () => {
    const { numLinesAnswer, redAnswer } = this.props;
    switch (numLinesAnswer) {
      case "aLine":
        return "positiveA";
      case "bLine":
        return "positiveB";
      case "twoLines":
        return "positive";
      case "threeLines":
        return "positiveAB";
      case "noneOfTheAbove":
        return getResultRedAnswer(redAnswer);
      default:
        return "negative";
    }
  };

  _getExplanation = () => {
    const { numLinesAnswer, redAnswer } = this.props;
    switch (numLinesAnswer) {
      case "aLine":
      case "bLine":
      case "threeLines":
        return numLinesAnswer;
      case "twoLines":
        return "onePinkAndBlue";
      case "noneOfTheAbove":
        return getExplanationRedAnswer(redAnswer);
      default:
        return "noPink";
    }
  };

  render() {
    const { hasNoSymptoms4Days, t } = this.props;
    const testResultString = !isShowRDTInterpretationOfType(
      RDTInterpretationEventTypes.UserHighContrast
    )
      ? t("why")
      : t("TestResult:why");
    const result = this._getResult();
    const explanation = this._getExplanation();
    const whatToDoResult = result.startsWith("positive") ? "positive" : result;
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
        <Text content={testResultString} style={styles.text} />
        <View style={{ marginHorizontal: GUTTER }}>
          <BulletPoint
            content={t("common:testResult:blueLine")}
            customBulletUri="listarrow"
          />
          <BulletPoint content={t(explanation)} customBulletUri="listarrow" />
        </View>
        {showNegativeExplanation && (
          <Fragment>
            <Text content={t("common:testResult:negativeExplanation")} />
            <View style={{ marginHorizontal: GUTTER }}>
              <BulletPoint
                content={t("common:testResult:negativeExplanationBullet")}
                customBulletUri="listarrow"
              />

              {hasNoSymptoms4Days && (
                <BulletPoint
                  content={t(
                    "common:testResult:negativeExplanationBulletAllUnder4Days"
                  )}
                  customBulletUri="listarrow"
                />
              )}
              {!hasNoSymptoms4Days && (
                <BulletPoint
                  content={t(
                    "common:testResult:negativeExplanationBulletOne4Days"
                  )}
                  customBulletUri="listarrow"
                />
              )}
            </View>
          </Fragment>
        )}
        <Divider />
        <CollapsibleText
          content={
            t(`common:testResult:${whatToDoResult}++WhatToDo`) +
            ` ${t("common:testResult:whatToDoCommon")}`
          }
          appEvent={AppEvents.WHAT_TO_DO_WITH_TEST_RESULT_PRESSED}
        />
      </Fragment>
    );
  }
}

function _getRDTInterpretationLines(
  readerResult?: RDTReaderResult
): string | undefined {
  let numLines;
  if (
    !isShowRDTInterpretationOfType(
      RDTInterpretationEventTypes.UserHighContrast
    ) &&
    readerResult
  ) {
    if (readerResult.controlLineFound) {
      if (readerResult.testALineFound && readerResult.testBLineFound) {
        numLines = "threeLines";
      } else if (readerResult.testALineFound) {
        numLines = "aLine";
      } else if (readerResult.testBLineFound) {
        numLines = "bLine";
      } else {
        numLines = "noPink";
      }
    }
  }

  return numLines;
}

export default connect((state: StoreState) => ({
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
  redAnswer: getSelectedButton(state, PinkWhenBlueConfig),
  // Fall back to whatever the user said they saw.  We could change our minds
  // later and decide to return undefined here if we don't trust the user.
  numLinesAnswer:
    _getRDTInterpretationLines(
      state.survey.rdtInfo && state.survey.rdtInfo.rdtReaderResult
    ) || getSelectedButton(state, NumLinesSeenConfig),
  readerResult: state.survey.rdtInfo && state.survey.rdtInfo.rdtReaderResult,
}))(withNamespaces("TestResultRDT")(TestResultRDT));

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
