// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { RefObject } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { SurveyQuestionData } from "../../resources/QuestionConfig";
import OptionList, { newSelectedOptionsList } from "./OptionList";
import QuestionText from "./QuestionText";
import { GUTTER } from "../styles";
import { ScrollIntoView } from "react-native-scroll-into-view";

interface Props {
  question: SurveyQuestionData;
  highlighted?: boolean;
  onRef?: RefObject<any>;
  style?: StyleProp<ViewStyle>;
  getAnswer(key: string, id: string): any;
  updateAnswer(answer: object, data: SurveyQuestionData): void;
}

class OptionQuestion extends React.Component<Props & WithNamespaces> {
  render() {
    const { style, question, t } = this.props;
    return (
      <ScrollIntoView
        onMount={false}
        ref={this.props.onRef}
        style={[{ alignSelf: "stretch", marginBottom: GUTTER }]}
      >
        <QuestionText question={question} />
        <OptionList
          data={newSelectedOptionsList(
            question.optionList!.options,
            this.props.getAnswer("options", question.id)
          )}
          exclusiveOptions={question.optionList!.exclusiveOptions}
          highlighted={this.props.highlighted}
          multiSelect={question.optionList!.multiSelect}
          numColumns={1}
          onChange={options => this.props.updateAnswer({ options }, question)}
        />
      </ScrollIntoView>
    );
  }
}
export default withNamespaces()(OptionQuestion);
