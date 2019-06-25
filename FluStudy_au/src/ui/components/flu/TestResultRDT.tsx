import React, { Fragment } from "react";
import { StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { StoreState } from "../../../store";
import { getSelectedButton } from "../../../util/survey";
import { NumLinesSeenConfig } from "audere-lib/coughQuestionConfig";
import BorderView from "../BorderView";
import { BulletPoint } from "../BulletPoint";
import Divider from "../Divider";
import Text from "../Text";
import { GUTTER } from "../../styles";

interface Props {
  numLinesAnswer?: string;
}

class TestResultRDT extends React.Component<Props & WithNamespaces> {
  _getResult = () => {
    const { numLinesAnswer } = this.props;
    switch (numLinesAnswer) {
      case "twoLines":
        return "positive";
      case "threeLines":
        return "positive";
      default:
        return "negative";
    }
  };

  _getExplanation = () => {
    const { numLinesAnswer } = this.props;
    switch (numLinesAnswer) {
      case "twoLines":
        return "onePinkAndBlue";
      case "threeLines":
        return "onePinkAndBlue";
      default:
        return "noPink";
    }
  };

  render() {
    const { t } = this.props;
    return (
      <Fragment>
        <BorderView style={styles.border}>
          <Text
            center={true}
            content={t("common:testResult:" + this._getResult())}
          />
        </BorderView>
        <Text content={t("common:testResult:why")} style={styles.text} />
        <View style={{ marginHorizontal: GUTTER }}>
          <BulletPoint content={t("blueLine")} customBulletUri="listarrow" />
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

export default connect((state: StoreState) => ({
  numLinesAnswer: getSelectedButton(state, NumLinesSeenConfig),
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
