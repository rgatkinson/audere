import React from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
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
  buttonStyle?: StyleProp<ViewStyle>;
  desc?: boolean;
  question: SurveyQuestionData;
  style?: StyleProp<ViewStyle>;
  title?: string;
  vertical?: boolean;
  getAnswer(key: string, id: string): any;
  updateAnswer(answer: object, data: SurveyQuestionData): void;
}

class ButtonGrid extends React.Component<Props & WithNamespaces> {
  render() {
    const { question, t } = this.props;
    return (
      <View style={[styles.container, this.props.style]}>
        <QuestionText
          text={
            !!this.props.title
              ? this.props.title
              : t("surveyTitle:" + question.title)
          }
          subtext={
            this.props.desc
              ? t("surveyDescription:" + question.description)
              : undefined
          }
        />
        <Grid
          columns={this.props.vertical ? 1 : question.buttons.length}
          items={question.buttons}
          itemFencePostStyle={
            !this.props.vertical && styles.horizontalFencePost
          }
          itemStyle={styles.buttonContainer}
          rowFencePostStyle={this.props.vertical && styles.verticalFencePost}
          rowStyle={[{ alignItems: "center" }, this.props.buttonStyle]}
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
  buttonContainer: {
    borderWidth: BORDER_WIDTH,
    borderColor: BORDER_COLOR,
    justifyContent: "center",
  },
  button: {
    height: RADIO_BUTTON_HEIGHT,
    justifyContent: "center",
  },
  buttonText: {
    color: SECONDARY_COLOR,
  },
  horizontalFencePost: {
    borderLeftWidth: 0,
    marginLeft: 0,
  },
  container: {
    alignSelf: "stretch",
    marginBottom: GUTTER,
  },
  selectedButton: {
    backgroundColor: BORDER_COLOR,
  },
  selectedButtonText: {
    color: "white",
  },
  verticalFencePost: {
    borderTopWidth: 0,
  },
});
