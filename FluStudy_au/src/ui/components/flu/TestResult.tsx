import React, { Fragment } from "react";
import { StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { StoreState } from "../../../store";
import { getSelectedButton } from "../../../util/survey";
import { PinkWhenBlueConfig } from "audere-lib/coughQuestionConfig";
import BorderView from "../BorderView";
import { BulletPoint } from "../BulletPoint";
import Text from "../Text";
import { GUTTER } from "../../styles";

interface Props {
  redAnswer?: string;
}

class TestResult extends React.Component<Props & WithNamespaces> {
  _getResult = () => {
    const { redAnswer } = this.props;
    switch (redAnswer) {
      case "yesAboveBlue":
        return "influenzaA";
      case "yesBelowBlue":
        return "influenzaB";
      case "yesAboveBelowBlue":
        return "influenzaAandB";
      default:
        return "negative";
    }
  };

  _getExplanation = () => {
    const { redAnswer } = this.props;
    switch (redAnswer) {
      case "yesAboveBlue":
        return "pinkAboveBlue";
      case "yesBelowBlue":
        return "pinkBelowBlue";
      case "yesAboveBelowBlue":
        return "pinkAboveAndBelowBlue";
      default:
        return "noPink";
    }
  };

  render() {
    const { t } = this.props;
    return (
      <Fragment>
        <BorderView style={styles.border}>
          <Text center={true} content={t(this._getResult())} />
        </BorderView>
        <Text content={t("why")} style={styles.text} />
        <View style={{ marginHorizontal: GUTTER }}>
          <BulletPoint content={t("blueLine")} customBulletUri="listarrow" />
          <BulletPoint
            content={t(this._getExplanation())}
            customBulletUri="listarrow"
          />
        </View>
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
