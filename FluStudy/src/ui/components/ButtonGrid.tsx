import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { ButtonConfig, SurveyQuestionData } from "../../resources/ScreenConfig";
import {
  BORDER_COLOR,
  BORDER_WIDTH,
  GUTTER,
  RADIO_BUTTON_HEIGHT,
  SECONDARY_COLOR,
} from "../styles";
import Grid from "./Grid";
import QuestionText from "./QuestionText";
import Text from "./Text";

interface Props {
  question: SurveyQuestionData;
  getAnswer(key: string, id: string): any;
  updateAnswer(answer: object, data: SurveyQuestionData): void;
}

class ButtonGrid extends React.Component<Props & WithNamespaces> {
  render() {
    const { question, t } = this.props;
    return (
      <View style={styles.container}>
        <QuestionText
          text={t("surveyTitle:" + question.title)}
          subtext={
            !!question.description
              ? t("surveyDescription:" + question.description)
              : undefined
          }
        />
        <Grid
          columns={question.buttons.length}
          items={question.buttons}
          itemFencePostStyle={{ borderLeftWidth: 0, marginLeft: 0 }}
          rowStyle={{ alignItems: "center" }}
          keyExtractor={button => button.key}
          renderItem={(button, width) => {
            const selectedKey = this.props.getAnswer(
              "selectedButtonKey",
              question.id
            );
            return (
              <TouchableOpacity
                key={button.key}
                onPress={() => {
                  const selectedButtonKey =
                    this.props.getAnswer("selectedButtonKey", question.id) ===
                    button.id
                      ? undefined
                      : button.key;
                  this.props.updateAnswer({ selectedButtonKey }, question);
                }}
                style={[
                  styles.button,
                  selectedKey === button.key && styles.selectedButton,
                ]}
              >
                <Text
                  bold={true}
                  center={true}
                  content={t("surveyButton:" + button.key)}
                  style={[
                    styles.buttonText,
                    selectedKey === button.key && styles.selectedButtonText,
                  ]}
                />
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  }
}
export default withNamespaces()<Props>(ButtonGrid);

const styles = StyleSheet.create({
  button: {
    borderWidth: BORDER_WIDTH,
    borderColor: BORDER_COLOR,
    height: RADIO_BUTTON_HEIGHT,
    justifyContent: "center",
  },
  buttonText: {
    color: SECONDARY_COLOR,
  },
  container: {
    alignSelf: "stretch",
    marginVertical: GUTTER / 2,
  },
  selectedButton: {
    backgroundColor: BORDER_COLOR,
  },
  selectedButtonText: {
    color: "white",
  },
});
