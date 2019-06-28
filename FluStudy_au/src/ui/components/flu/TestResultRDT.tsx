import React, { Fragment } from "react";
import { StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { StoreState, setRDTInterpretationShown, Action } from "../../../store";
import { getSelectedButton } from "../../../util/survey";
import {
  NumLinesSeenConfig,
  PinkWhenBlueConfig,
} from "audere-lib/coughQuestionConfig";
import BorderView from "../BorderView";
import { BulletPoint } from "../BulletPoint";
import Divider from "../Divider";
import Text from "../Text";
import {
  getResultRedAnswer,
  getExplanationRedAnswer,
} from "../../../util/fluResults";
import { GUTTER } from "../../styles";
import { getRemoteConfig } from "../../../util/remoteConfig";
import {
  tracker,
  AppEvents,
  RDTInterpretationEventTypes,
} from "../../../util/tracker";
import { RDTReaderResult } from "audere-lib/coughProtocol";

interface Props {
  numLinesAnswer?: string;
  redAnswer?: string;
  readerResult?: RDTReaderResult;
  dispatch(action: Action): void;
}

class TestResultRDT extends React.Component<Props & WithNamespaces> {
  componentDidMount() {
    const interpreter = getRemoteConfig("showRDTInterpretation") as
      | RDTInterpretationEventTypes
      | "";
    if (!!interpreter && this.props.readerResult) {
      tracker.logEvent(AppEvents.SHOWED_RDT_INTERPRETATION, { interpreter });
      this.props.dispatch(setRDTInterpretationShown(interpreter));
    }
  }

  _getResult = () => {
    const { numLinesAnswer, redAnswer } = this.props;
    switch (numLinesAnswer) {
      case "twoLines":
        return "positive";
      case "threeLines":
        return "positive";
      case "noneOfTheAbove":
        return getResultRedAnswer(redAnswer);
      default:
        return "negative";
    }
  };

  _getExplanation = () => {
    const { numLinesAnswer, redAnswer } = this.props;
    switch (numLinesAnswer) {
      case "twoLines":
        return "onePinkAndBlue";
      case "threeLines":
        return "onePinkAndBlue";
      case "noneOfTheAbove":
        return getExplanationRedAnswer(redAnswer);
      default:
        return "noPink";
    }
  };

  render() {
    const { t } = this.props;
    const testResultString = !!getRemoteConfig("showRDTInterpretation")
      ? t("why")
      : t("TestResult:why");
    return (
      <Fragment>
        <BorderView style={styles.border}>
          <Text
            center={true}
            content={t("common:testResult:" + this._getResult())}
          />
        </BorderView>
        <Text content={t("common:testResult:whyTitle")} style={styles.text} />
        <Text content={testResultString} style={styles.text} />
        <View style={{ marginHorizontal: GUTTER }}>
          <BulletPoint
            content={t("common:testResult:blueLine")}
            customBulletUri="listarrow"
          />
          <BulletPoint
            content={t(this._getExplanation())}
            customBulletUri="listarrow"
          />
        </View>
        <Divider />
        <Text
          content={
            t(`common:testResult:${this._getResult()}WhatToDo`) +
            ` ${t("common:testResult:whatToDoCommon")}`
          }
          style={styles.text}
        />
      </Fragment>
    );
  }
}

function _getRDTInterpretationLines(
  readerResult?: RDTReaderResult
): string | undefined {
  let numLines;

  if (!!getRemoteConfig("showRDTInterpretation") && readerResult) {
    if (readerResult.controlLineFound) {
      if (readerResult.testALineFound && readerResult.testBLineFound) {
        numLines = "threeLines";
      } else if (readerResult.testALineFound || readerResult.testBLineFound) {
        numLines = "twoLines";
      } else {
        numLines = "noPink";
      }
    }
  }

  return numLines;
}

export default connect((state: StoreState) => ({
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
    marginHorizontal: GUTTER,
  },
  text: {
    alignSelf: "stretch",
    marginBottom: GUTTER,
    marginHorizontal: GUTTER,
  },
});
