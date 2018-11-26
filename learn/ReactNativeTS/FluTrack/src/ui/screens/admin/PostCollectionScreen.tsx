// For shared functions used by AdverseScreen and AdverseDetailsScreen
import React from "react";
import { SurveyResponse, SurveyAnswer } from "../../../store";
import OptionList from "../experiment/components/OptionList";

import { OptionListConfig } from "../experiment/components/SurveyQuestion";

export default class PostCollectionScreen<T> extends React.Component<T> {
  _getSelectedOptionMap = (
    id: string,
    optionList: OptionListConfig,
    surveyResponses?: Map<string, SurveyResponse>
  ): Map<string, boolean> => {
    return !!surveyResponses &&
      surveyResponses!.has(id) &&
      !!surveyResponses!.get(id)!.answer!.options
      ? new Map<string, boolean>(surveyResponses.get(id)!.answer!.options!)
      : OptionList.emptyMap(optionList.options);
  };
  _getAndInitializeResponse = (
    id: string,
    title: string,
    surveyResponses?: Map<string, SurveyResponse>
  ): [Map<string, SurveyResponse>, SurveyAnswer] => {
    const responses = surveyResponses
      ? new Map<string, SurveyResponse>(surveyResponses)
      : new Map<string, SurveyResponse>();

    if (!responses.has(id)) {
      responses.set(id, {
        answer: {},
        questionId: id,
        questionText: title,
      });
    }
    return [responses, responses.has(id) ? responses.get(id)!.answer! : {}];
  };
}
