import React from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { ScrollIntoView } from "react-native-scroll-into-view";
import { SurveyQuestionData } from "../../resources/ScreenConfig";
import {
  BORDER_WIDTH,
  GUTTER,
  ERROR_COLOR,
  FONT_NORMAL,
  RADIO_BUTTON_HEIGHT,
  REGULAR_TEXT,
  SECONDARY_COLOR,
  BORDER_COLOR,
  RADIO_INPUT_HEIGHT,
  TEXT_COLOR,
} from "../styles";
import QuestionText from "./QuestionText";
import Text from "./Text";

interface Props {
  desc?: boolean;
  hideQuestion?: boolean;
  onRef?: any;
  question: SurveyQuestionData;
  scrollOnMount?: boolean;
  shouldValidate?: boolean;
  validationError?: string;
  style?: StyleProp<ViewStyle>;
  title?: string;
  getAnswer(key: string, id: string): any;
  updateAnswer(answer: object, data: SurveyQuestionData): void;
}

interface State {
  selected: string | undefined;
}

class RadioGrid extends React.Component<Props & WithNamespaces, State> {
  static defaultProps = {
    scrollOnMount: false,
  };

  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = {
      selected: props.getAnswer("selectedButtonKey", props.question.id),
    };
  }

  _onPress = (key: string) => {
    const selected = key;

    this.setState({ selected });
    this.props.updateAnswer(
      { selectedButtonKey: selected },
      this.props.question
    );
  };

  render() {
    const {
      desc,
      hideQuestion,
      onRef,
      question,
      scrollOnMount,
      style,
      t,
      title,
    } = this.props;

    return (
      <ScrollIntoView
        style={[styles.container, style]}
        ref={onRef}
        onMount={scrollOnMount}
      >
        {!hideQuestion && (
          <QuestionText
            text={!!title ? title : t("surveyTitle:" + question.title)}
            subtext={
              desc ? t("surveyDescription:" + question.description) : undefined
            }
            required={!title && question.required}
          />
        )}
        <View>
          {question.buttons.map((buttonConfig, i) => {
            const isSelected = buttonConfig.key == this.state.selected;
            return (
              <TouchableOpacity
                key={buttonConfig.key}
                onPress={() => this._onPress(buttonConfig.key)}
                style={
                  i === question.buttons.length - 1
                    ? styles.radioRowLast
                    : styles.radioRow
                }
              >
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                  }}
                >
                  <View style={{ justifyContent: "center" }}>
                    <View
                      style={[
                        styles.radioButton,
                        isSelected && styles.selectedRadioColor,
                      ]}
                    >
                      {isSelected && <View style={styles.radioButtonCenter} />}
                    </View>
                  </View>
                  <View style={{ flex: 1, justifyContent: "center" }}>
                    <Text
                      style={[
                        styles.radioText,
                        isSelected && styles.selectedRadioColor,
                      ]}
                      content={t(`surveyButton:${buttonConfig.key}`)}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          {this.props.shouldValidate &&
            !this.state.selected &&
            this.props.validationError && (
              <Text
                content={this.props.validationError}
                style={styles.errorText}
              />
            )}
        </View>
      </ScrollIntoView>
    );
  }
}
export default withNamespaces()(RadioGrid);

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    marginBottom: GUTTER,
  },
  errorText: {
    color: ERROR_COLOR,
    fontFamily: FONT_NORMAL,
    marginTop: GUTTER / 4,
  },
  radioButton: {
    borderColor: TEXT_COLOR,
    borderWidth: BORDER_WIDTH,
    borderRadius: RADIO_INPUT_HEIGHT / 2,
    height: RADIO_INPUT_HEIGHT,
    width: RADIO_INPUT_HEIGHT,
  },
  radioButtonCenter: {
    backgroundColor: SECONDARY_COLOR,
    borderRadius: RADIO_INPUT_HEIGHT / 4,
    margin: RADIO_INPUT_HEIGHT / 4 - 1,
    height: RADIO_INPUT_HEIGHT / 2,
    width: RADIO_INPUT_HEIGHT / 2,
  },
  radioRow: {
    borderColor: BORDER_COLOR,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: RADIO_BUTTON_HEIGHT,
  },
  radioRowLast: {
    borderColor: BORDER_COLOR,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: RADIO_BUTTON_HEIGHT,
  },
  radioText: {
    fontSize: REGULAR_TEXT,
    margin: GUTTER / 2,
  },
  selectedRadioColor: {
    color: SECONDARY_COLOR,
    borderColor: SECONDARY_COLOR,
  },
});
