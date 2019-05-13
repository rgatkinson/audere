// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { Fragment } from "react";
import { connect } from "react-redux";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { WorkflowInfo } from "audere-lib/feverProtocol";
import {
  Action,
  StoreState,
  setOneMinuteStartTime,
  setTenMinuteStartTime,
  setWorkflow,
} from "../store";
import reduxWriter, { ReduxWriterProps } from "../store/ReduxWriter";
import BulletPoint from "../ui/components/BulletPoint";
import Button from "../ui/components/Button";
import Links from "../ui/components/Links";
import RDTImage from "../ui/components/flu/RDTImage";
import Screen from "../ui/components/Screen";
import { tracker, FunnelEvents, AppHealthEvents } from "../util/tracker";
import {
  GeneralHealthScreenConfig,
  WhatSymptomsConfig,
  TestFeedbackConfig,
  SurveyQuestionData,
} from "./ScreenConfig";

interface ButtonConfig {
  fontSize?: number;
  label: string;
  next: string;
}

interface LinkConfig {
  center?: boolean;
  footer?: boolean;
  links: string[];
}

export interface SimpleScreenConfig {
  barcode?: boolean;
  bulletPoints?: boolean;
  buttonLabel?: boolean;
  centerDesc?: boolean;
  disclaimer?: boolean;
  dispatchOnNext?: Action;
  extraButton?: ButtonConfig;
  extraText?: boolean;
  footerLinkConfig?: LinkConfig;
  funnelEvent?: string;
  hasDivider?: boolean;
  hideBackButton?: boolean;
  image?: string;
  key: string;
  linkConfig?: LinkConfig;
  next?: string;
  questions?: SurveyQuestionData[];
  rdtImage?: boolean;
  skipButton?: boolean;
  splashImage?: string;
  workflowEvent?: string;
  videoId?: string;
}

interface Props {
  email: string;
  navigation: NavigationScreenProp<any, any>;
  workflow: WorkflowInfo;
  dispatch(action: Action): void;
}

export const generateSimpleScreen = (config: SimpleScreenConfig) => {
  class SimpleScreen extends React.Component<
    Props & WithNamespaces & ReduxWriterProps
  > {
    componentDidMount() {
      if (config.funnelEvent) {
        tracker.logEvent(config.funnelEvent);
      }
      if (config.workflowEvent) {
        const workflow = { ...this.props.workflow };
        workflow[config.workflowEvent] = new Date().toISOString();
        this.props.dispatch(setWorkflow(workflow));
      }
    }

    _onNext = () => {
      !!config.dispatchOnNext && this.props.dispatch(config.dispatchOnNext);
      config.next && this.props.navigation.push(config.next);
    };

    render() {
      const { email, t } = this.props;

      return (
        <Screen
          barcode={config.barcode}
          buttonLabel={config.buttonLabel && t("buttonLabel")}
          centerDesc={config.centerDesc}
          desc={t("desc", { email })}
          disclaimer={config.disclaimer && t("disclaimer")}
          extraText={config.extraText && t("extraText")}
          footer={
            <Fragment>
              {!!config.extraButton && (
                <Button
                  enabled={true}
                  fontSize={config.extraButton.fontSize}
                  label={t(config.extraButton.label)}
                  primary={true}
                  onPress={() =>
                    this.props.navigation.push(config.extraButton!.next)
                  }
                />
              )}
              {!!config.footerLinkConfig && (
                <Links
                  center={config.footerLinkConfig.center}
                  links={config.footerLinkConfig.links}
                />
              )}
            </Fragment>
          }
          hasDivider={config.hasDivider}
          hideBackButton={config.hideBackButton}
          image={config.image}
          navigation={this.props.navigation}
          questions={config.questions}
          skipButton={config.skipButton}
          splashImage={config.splashImage}
          title={t("title")}
          videoId={config.videoId}
          getAnswer={this.props.getAnswer}
          onNext={this._onNext}
          updateAnswer={this.props.updateAnswer}
        >
          {!!config.bulletPoints &&
            t("bullets")
              .split("\n")
              .map((bullet: string, index: number) => {
                return <BulletPoint key={`bullet-${index}`} content={bullet} />;
              })}
          {!!config.rdtImage && <RDTImage />}
          {!!config.linkConfig && (
            <Links
              center={config.linkConfig.center}
              links={config.linkConfig.links}
            />
          )}
        </Screen>
      );
    }
  }

  return connect((state: StoreState) => {
    return {
      email: state.survey.email,
      workflow: state.survey.workflow,
    };
  })(reduxWriter(withNamespaces(config.key)(SimpleScreen)));
};

export const simpleScreens: SimpleScreenConfig[] = [
  {
    barcode: true,
    funnelEvent: FunnelEvents.SCAN_CONFIRMATION,
    image: "barcodesuccess",
    key: "ScanConfirmation",
    next: "Unpacking",
    workflowEvent: "surveyStartedAt",
  },
  {
    barcode: true,
    funnelEvent: FunnelEvents.SCAN_CONFIRMATION,
    image: "barcodesuccess",
    key: "ManualConfirmation",
    next: "Unpacking",
    workflowEvent: "surveyStartedAt",
  },
  {
    image: "opennasalswab",
    key: "OpenSwab",
    next: "Mucus",
  },
  {
    image: "collectmucus",
    key: "Mucus",
    next: "SwabInTube",
    videoId: "collectSample",
  },
  {
    buttonLabel: true,
    dispatchOnNext: setOneMinuteStartTime(),
    funnelEvent: FunnelEvents.SURVIVED_FIRST_SWAB,
    image: "putswabintube",
    key: "SwabInTube",
    next: "FirstTimer",
  },
  {
    funnelEvent: FunnelEvents.PASSED_FIRST_TIMER,
    image: "removeswabfromtube",
    key: "RemoveSwabFromTube",
    next: "OpenTestStrip",
    videoId: "removeSwabFromTube",
  },
  {
    image: "openteststrip",
    key: "OpenTestStrip",
    next: "StripInTube",
    videoId: "openTestStrip",
  },
  {
    dispatchOnNext: setTenMinuteStartTime(),
    image: "openteststrip_1",
    key: "StripInTube",
    next: "WhatSymptoms",
    videoId: "putTestStripInTube",
  },
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
    image: "removeteststrip",
    key: "TestStripReady",
    next: "RDTInstructions",
    videoId: "removeTestStrip",
  },
  {
    key: "TestStripConfirmation",
    next: "TestStripSurvey",
    rdtImage: true,
  },
  {
    key: "TestResult",
    next: "Advice",
  },
  {
    key: "Advice",
    linkConfig: { links: ["ausGov", "CDC", "myDr"] },
    next: "CleanTest",
  },
  {
    key: "CleanTest",
    next: "TestFeedback",
  },
  {
    image: "nicejob",
    key: "TestFeedback",
    next: "Thanks",
    questions: [TestFeedbackConfig],
  },
  {
    image: "finalthanks",
    key: "Thanks",
    skipButton: true,
    workflowEvent: "surveyCompletedAt",
  },
];
