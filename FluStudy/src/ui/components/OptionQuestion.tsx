import React from "react";
import { View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { ButtonConfig, SurveyQuestionData } from "../../resources/ScreenConfig";
import OptionList, { newSelectedOptionsList } from "./OptionList";
import QuestionText from "./QuestionText";
import { GUTTER } from "../styles";

interface Props {
  question: SurveyQuestionData;
  getAnswer(key: string, id: string): any;
  updateAnswer(answer: object, data: SurveyQuestionData): void;
}

class OptionQuestion extends React.Component<Props & WithNamespaces> {
  render() {
    const { question, t } = this.props;
    return (
      <View style={{ alignSelf: "stretch", marginVertical: GUTTER }}>
        <QuestionText
          text={t("surveyTitle:" + question.title)}
          subtext={t("surveyDescription:" + question.description)}
        />
        <OptionList
          data={newSelectedOptionsList(
            question.optionList!.options,
            this.props.getAnswer("options", question.id)
          )}
          exclusiveOption={question.optionList!.exclusiveOption}
          multiSelect={true}
          numColumns={1}
          onChange={options => this.props.updateAnswer({ options }, question)}
        />
      </View>
    );
  }
}
export default withNamespaces()<Props>(OptionQuestion);
