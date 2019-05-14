// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import reduxWriter, { ReduxWriterProps } from "../store/ReduxWriter";
import Screen from "../ui/components/Screen";
import {
  GeneralHealthScreenConfig,
  WhatSymptomsConfig,
  TestFeedbackConfig,
  SurveyQuestionData,
} from "./ScreenConfig";

export interface SimpleScreenConfig {
  centerDesc?: boolean;
  extraText?: boolean;
  hasDivider?: boolean;
  image?: string;
  key: string;
  next?: string;
  questions?: SurveyQuestionData[];
}

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

export const generateSimpleScreen = (config: SimpleScreenConfig) => {
  class SimpleScreen extends React.Component<
    Props & WithNamespaces & ReduxWriterProps
  > {
    _onNext = () => {
      config.next && this.props.navigation.push(config.next);
    };

    render() {
      const { t } = this.props;

      return (
        <Screen
          centerDesc={config.centerDesc}
          desc={t("desc")}
          extraText={config.extraText && t("extraText")}
          hasDivider={config.hasDivider}
          image={config.image}
          navigation={this.props.navigation}
          questions={config.questions}
          title={t("title")}
          getAnswer={this.props.getAnswer}
          onNext={this._onNext}
          updateAnswer={this.props.updateAnswer}
        />
      );
    }
  }

  return reduxWriter(withNamespaces(config.key)(SimpleScreen));
};

export const simpleScreens: SimpleScreenConfig[] = [
  {
    centerDesc: true,
    hasDivider: true,
    key: "WhatSymptoms",
    next: "WhenSymptoms",
    questions: [WhatSymptomsConfig],
  },
  {
    centerDesc: true,
    extraText: true,
    hasDivider: true,
    key: "GeneralHealth",
    next: "ThankYouSurvey",
    questions: GeneralHealthScreenConfig,
  },
  {
    image: "nicejob",
    key: "TestFeedback",
    next: "Thanks",
    questions: [TestFeedbackConfig],
  },
];
