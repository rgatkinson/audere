import { NavigationScreenProp } from "react-navigation";
import { SurveyQuestionData } from "./QuestionnaireConfig";
import { Action } from "../store/index";

export interface SurveyQuestionProps {
  active: boolean;
  data: SurveyQuestionData;
  navigation: NavigationScreenProp<any, any>;
  locationType: string;
  dispatch(action: Action): void;
  onActivate(): void;
  onNext(nextQuestion: string | null): void;
}
