import React from "react";
import { StyleSheet } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import reduxWriter, { ReduxWriterProps } from "../../../store/ReduxWriter";
import { PinkWhenBlueConfig } from "../../../resources/QuestionConfig";
import BorderView from "../BorderView";
import Text from "../Text";
import { GUTTER } from "../../styles";

class TestResult extends React.Component<WithNamespaces & ReduxWriterProps> {
  _getResult = () => {
    const redAnswer = this.props.getAnswer(
      "selectedButtonKey",
      PinkWhenBlueConfig.id
    );
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

  render() {
    const { t } = this.props;
    return (
      <BorderView style={styles.border}>
        <Text center={true} content={t(this._getResult())} />
      </BorderView>
    );
  }
}

export default reduxWriter(withNamespaces("testResult")(TestResult));

const styles = StyleSheet.create({
  border: {
    borderRadius: 10,
    paddingVertical: GUTTER,
    marginHorizontal: GUTTER,
  },
});
