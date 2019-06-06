import React from "react";
import { View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import reduxWriter, { ReduxWriterProps } from "../../../store/ReduxWriter";
import { PinkWhenBlueConfig } from "../../../resources/QuestionConfig";
import BorderView from "../BorderView";
import { BulletPoint } from "../BulletPoint";
import Text from "../Text";
import { GUTTER } from "../../styles";

class TestResultExplanation extends React.Component<
  WithNamespaces & ReduxWriterProps
> {
  _getExplanation = () => {
    const redAnswer = this.props.getAnswer(
      "selectedButtonKey",
      PinkWhenBlueConfig.id
    );
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
      <View style={{ marginHorizontal: GUTTER }}>
        <BulletPoint content={t("blueLine")} customBulletUri="listarrow" />
        <BulletPoint
          content={t(this._getExplanation())}
          customBulletUri="listarrow"
        />
      </View>
    );
  }
}

export default reduxWriter(withNamespaces("testResult")(TestResultExplanation));
