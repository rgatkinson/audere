import { SurveyQuestion } from "audere-lib/chillsQuestionConfig";
import { StoreState } from "../store";

export function getAnswerType(questionType: string) {
  switch (questionType) {
    case "buttonGrid":
    case "radioGrid":
    case "dropdown":
      return "selectedButtonKey";
    case "optionQuestion":
    case "multiDropdown":
      return "options";
    case "datePicker":
    case "monthPicker":
      return "dateInput";
    case "zipCodeInput":
    case "textInput":
      return "textInput";
    case "text":
    default:
      return "";
  }
}

export function getAnswerForID(
  state: StoreState,
  questionId: string,
  questionType: string
): any {
  const response = state.questions[questionId];
  return !response || !response!.answer || !response!.answer![questionType]
    ? undefined
    : response!.answer![questionType];
}

export function getAnswer(state: StoreState, question: SurveyQuestion): any {
  return getAnswerForID(state, question.id, getAnswerType(question.type));
}

export function getSelectedButton(
  state: StoreState,
  question: SurveyQuestion
): string | undefined {
  return getAnswer(state, question) as string | undefined;
}
