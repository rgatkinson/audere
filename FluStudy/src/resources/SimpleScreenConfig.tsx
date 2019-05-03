import React from "react";
import { WithNamespaces, withNamespaces } from "react-i18next";
import BulletPoint from "../ui/components/BulletPoint";
import Links from "../ui/components/Links";
import Screen from "../ui/components/Screen";
import { NavigationScreenProp } from "react-navigation";
import { tracker, FunnelEvents, AppHealthEvents } from "../util/tracker";

interface LinkConfig {
  center?: boolean;
  footer?: boolean;
  links: string[];
}

export interface SimpleScreenConfig {
  bullets?: boolean;
  footerLinkConfig?: LinkConfig;
  funnelEvent?: string;
  hideBackButton?: boolean;
  image?: string;
  key: string;
  linkConfig?: LinkConfig;
  next?: string;
  skipButton?: boolean;
  splashImage?: string;
  videoId?: string;
}

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

export const generateSimpleScreen = (config: SimpleScreenConfig) => {
  class SimpleScreen extends React.Component<Props & WithNamespaces> {
    componentDidMount() {
      if (config.funnelEvent) {
        tracker.logEvent(config.funnelEvent);
      }
    }

    _onNext = () => {
      config.next && this.props.navigation.push(config.next);
    };

    render() {
      const { t } = this.props;

      return (
        <Screen
          canProceed={true}
          desc={t("desc")}
          footer={
            !!config.footerLinkConfig && (
              <Links
                center={config.footerLinkConfig.center}
                links={config.footerLinkConfig.links}
              />
            )
          }
          hideBackButton={config.hideBackButton}
          image={config.image}
          navigation={this.props.navigation}
          skipButton={config.skipButton}
          splashImage={config.splashImage}
          title={t("title")}
          videoId={config.videoId}
          onNext={this._onNext}
        >
          {!!config.bullets &&
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

  return withNamespaces(config.key)(SimpleScreen);
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
    bullets: true,
    image: "preparingfortest",
    key: "WhatsNext",
    next: "ScanInstructions",
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
];
