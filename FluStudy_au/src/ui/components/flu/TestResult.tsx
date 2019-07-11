import React, { Fragment } from "react";
import { StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { Action, StoreState, setResultShown } from "../../../store";
import { getSelectedButton } from "../../../util/survey";
import { PinkWhenBlueConfig } from "audere-lib/coughQuestionConfig";
import BorderView from "../BorderView";
import { BulletPoint } from "../BulletPoint";
import Divider from "../Divider";
import Text from "../Text";
import {
  getExplanationRedAnswer,
  getResultRedAnswer,
} from "../../../util/fluResults";
import { GUTTER } from "../../styles";

interface Props {
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
    const { redAnswer, t } = this.props;
    const result = getResultRedAnswer(redAnswer);
    return (
      <Fragment>
        <BorderView style={styles.border}>
          <Text center={true} content={t(`common:testResult:${result}`)} />
        </BorderView>
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
        <Divider />
        <Text
          content={
            t(`common:testResult:${result}WhatToDo`) +
            ` ${t("common:testResult:whatToDoCommon")}`
          }
          style={styles.text}
        />
      </Fragment>
    );
  }
}

export default connect((state: StoreState) => ({
  redAnswer: getSelectedButton(state, PinkWhenBlueConfig),
}))(withNamespaces("TestResult")(TestResult));

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
