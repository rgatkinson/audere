import React, { Fragment } from "react";
import { StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { StoreState } from "../../../store";
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
}

class TestResult extends React.Component<Props & WithNamespaces> {
  render() {
    const { redAnswer, t } = this.props;
    return (
      <Fragment>
        <BorderView style={styles.border}>
          <Text
            center={true}
            content={t("common:testResult:" + getResultRedAnswer(redAnswer))}
          />
        </BorderView>
        <Text content={t("common:testResult:why")} style={styles.text} />
        <View style={{ marginHorizontal: GUTTER }}>
          <BulletPoint content={t("blueLine")} customBulletUri="listarrow" />
          <BulletPoint
            content={t(getExplanationRedAnswer(redAnswer))}
            customBulletUri="listarrow"
          />
        </View>
        <Divider />
        <Text
          content={
            t(`common:testResult:${getResultRedAnswer(redAnswer)}WhatToDo`) +
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
