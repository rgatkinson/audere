// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { Fragment } from "react";
import { connect } from "react-redux";
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
import Screen from "../ui/components/Screen";
import { NavigationScreenProp } from "react-navigation";
import { tracker, FunnelEvents, AppHealthEvents } from "../util/tracker";
import {
  FirstTestFeedbackConfig,
  GeneralHealthScreenConfig,
  WhatSymptomsConfig,
  SecondTestFeedbackConfig,
  SurveyQuestionData,
} from "./ScreenConfig";
import { EXTRA_SMALL_TEXT } from "../ui/styles";

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
          canProceed={true}
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
    hideBackButton: true,
    key: "Welcome",
    footerLinkConfig: {
      center: true,
      footer: true,
      links: ["haveKitAlready"],
    },
    next: "Why",
    splashImage: "welcome",
  },
  {
    key: "What",
    next: "Age",
    splashImage: "whatdoidonext",
  },
  {
    disclaimer: true,
    funnelEvent: AppHealthEvents.KIT_ORDER_BLOCKED,
    image: "thanksforyourinterest",
    key: "OutOfKits",
    linkConfig: { links: ["learnMore", "findMedHelp"] },
    skipButton: true,
  },
  {
    funnelEvent: FunnelEvents.AGE_INELIGIBLE,
    hideBackButton: true,
    image: "thanksforyourinterest",
    key: "AgeIneligible",
    linkConfig: { links: ["learnMore", "findMedHelp"] },
    skipButton: true,
  },
  {
    funnelEvent: FunnelEvents.ADDRESS_INELIGIBLE,
    image: "thanksforyourinterest",
    key: "AddressIneligible",
    linkConfig: { links: ["learnMore", "findMedHelp"] },
    skipButton: true,
  },
  {
    funnelEvent: FunnelEvents.PO_BOX_INELIGIBLE,
    image: "thanksforyourinterest",
    key: "POBoxIneligible",
    linkConfig: { links: ["learnMore", "findMedHelp"] },
    skipButton: true,
  },
  {
    funnelEvent: FunnelEvents.STATE_INELIGIBLE,
    image: "thanksforyourinterest",
    key: "StateIneligible",
    linkConfig: { links: ["learnMore", "findMedHelp"] },
    skipButton: true,
  },
  {
    disclaimer: true,
    funnelEvent: FunnelEvents.SYMPTOMS_INELIGIBLE,
    hideBackButton: true,
    image: "thanksforyourinterest",
    key: "SymptomsIneligible",
    linkConfig: { links: ["learnMore", "findMedHelp"] },
    skipButton: true,
  },
  {
    bulletPoints: true,
    disclaimer: true,
    extraText: true,
    hideBackButton: true,
    image: "preconsent",
    key: "PreConsent",
    next: "Consent",
  },
  {
    bulletPoints: true,
    disclaimer: true,
    image: "flukitordered",
    key: "KitOrdered",
    next: "ThankYouScreening",
  },
  {
    bulletPoints: true,
    image: "thanksforparticipating",
    key: "ThankYouScreening",
    skipButton: true,
    workflowEvent: "screeningCompletedAt",
  },
  {
    // NOTE: removed, keeping only for navigation state
    hideBackButton: true,
    image: "thanksforyourinterest",
    key: "Ineligible",
    linkConfig: { links: ["learnMore", "findMedHelp"] },
    skipButton: true,
  },
  {
    // NOTE: removed, keeping only for navigation state
    image: "flukitordered",
    key: "Confirmation",
    next: "ThankYouScreening",
  },
  {
    // NOTE: removed, keeping only for navigation state
    image: "flukitordered",
    key: "PushNotifications",
    next: "ThankYouScreening",
  },
  {
    // NOTE: removed, keeping only for navigation state
    image: "beforeyoubeing",
    key: "Before",
    next: "ScanInstructions",
  },
  {
    // NOTE: removed, keeping only for navigationstate
    image: "whatsnext",
    key: "TestInstructions",
    next: "Unpacking",
  },
  {
    bulletPoints: true,
    image: "preparingfortest",
    key: "WhatsNext",
    next: "ScanInstructions",
  },
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
    image: "unpackinginstructions",
    key: "Unpacking",
    linkConfig: {
      links: ["kitMissingItems"],
    },
    next: "Swab",
  },
  {
    image: "begin1sttest",
    key: "Swab",
    next: "SwabPrep",
    videoId: "beginFirstTest",
  },
  {
    image: "preparetube",
    key: "SwabPrep",
    next: "OpenSwab",
    videoId: "prepareTube",
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
    next: "FinishTube",
    videoId: "removeTestStrip",
  },
  {
    image: "finishwithtube",
    key: "FinishTube",
    next: "LookAtStrip",
    videoId: "finishWithTube",
  },
  {
    image: "lookatteststrip",
    key: "LookAtStrip",
    next: "TestStripSurvey",
    videoId: "lookAtTestStrip",
  },
  {
    image: "sealupteststrip",
    key: "CleanFirstTest",
    next: "CleanFirstTest2",
    videoId: "cleanUpFirstTest1",
  },
  {
    image: "putteststripbag2",
    key: "CleanFirstTest2",
    next: "FirstTestFeedback",
    videoId: "cleanUpFirstTest2",
  },
  {
    image: "nicejob",
    key: "FirstTestFeedback",
    next: "BeginSecondTest",
    questions: [FirstTestFeedbackConfig],
  },
  {
    funnelEvent: FunnelEvents.COMPLETED_FIRST_TEST,
    image: "begin2ndtest",
    key: "BeginSecondTest",
    next: "PrepSecondTest",
    videoId: "beginSecondTest",
  },
  {
    image: "preparefortest",
    key: "PrepSecondTest",
    next: "MucusSecond",
    videoId: "prepareForTest",
  },
  {
    image: "collectmucus",
    key: "MucusSecond",
    next: "SwabInTubeSecond",
    videoId: "collectSampleFromNose",
  },
  {
    image: "putswabinredtube",
    key: "SwabInTubeSecond",
    next: "CleanSecondTest",
    videoId: "putSwabInTube2",
  },
  {
    image: "cleanupsecondtest",
    key: "CleanSecondTest",
    next: "SecondTestFeedback",
    videoId: "cleanUpSecondTest",
  },
  {
    image: "nicejob",
    key: "SecondTestFeedback",
    next: "Packing",
    questions: [SecondTestFeedbackConfig],
  },
  {
    funnelEvent: FunnelEvents.COMPLETED_SECOND_TEST,
    image: "packingthingsup",
    key: "Packing",
    next: "Stickers",
  },
  {
    image: "putstickersonbox",
    key: "Stickers",
    next: "SecondBag",
    videoId: "putStickersOnBox",
  },
  {
    image: "putbag2inbox",
    key: "SecondBag",
    next: "TapeBox",
    videoId: "putBag2InBox",
  },
  {
    image: "tapeupbox",
    key: "TapeBox",
    next: "ShipBox",
    videoId: "tapeUpBox",
  },
  {
    buttonLabel: true,
    extraButton: {
      fontSize: EXTRA_SMALL_TEXT,
      label: "iWillDropOff",
      next: "EmailOptIn",
    },
    image: "shippingyourbox",
    key: "ShipBox",
    linkConfig: { links: ["showNearbyUsps"] },
    next: "SchedulePickup",
    videoId: "shipBox",
  },
  {
    disclaimer: true,
    image: "finalthanks",
    key: "Thanks",
    linkConfig: { links: ["learnMore", "findMedHelp"] },
    skipButton: true,
    workflowEvent: "surveyCompletedAt",
  },
];
