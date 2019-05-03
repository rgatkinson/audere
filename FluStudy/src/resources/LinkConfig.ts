import { Linking, Platform } from "react-native";
import { connect } from "react-redux";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import {
  setWorkflow,
  toggleSupportCodeModal,
  Action,
  StoreState,
} from "../store";
import { WorkflowInfo } from "audere-lib/feverProtocol";
import { AddressConfig } from "./ScreenConfig";
import { SurveyResponse } from "../store/types";

const learnMoreUrl = "http://fluathome.org/"; // Site currently only supports http, not https

function createMapQueryUrl(query: string) {
  const scheme = Platform.select({ ios: "maps:0,0?q=", android: "geo:0,0?q=" });
  const encodedQuery = encodeURIComponent(query);
  const url = `${scheme}${encodedQuery}`;

  return url;
}

function showNearbyShippingLocations(zipcode: string) {
  let linkUrl = `https://tools.usps.com/go/POLocatorAction!input.action?address=${zipcode}&radius=10&locationTypeQ=po`;

  Linking.openURL(linkUrl);
}

export function emailSupport(params: string = "") {
  Linking.openURL("mailto:fluhelp@uw.edu" + params);
}

export function findMedHelp() {
  Linking.openURL(createMapQueryUrl("urgent care clinic"));
}

function learnMore() {
  Linking.openURL(learnMoreUrl);
}

export interface LinkConfigProps {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
  workflow: WorkflowInfo;
  zipcode: string;
}

export interface LinkConfig {
  action: (props: LinkConfigProps) => void;
  key: string;
}

export const LinkPropProvider = (LinkComponent: any) =>
  connect((state: StoreState) => {
    const address = state.survey.responses.find(
      (response: SurveyResponse) => response.questionId === AddressConfig.id
    );
    const zipcode =
      address &&
      address.answer &&
      address.answer["addressInput"] &&
      address.answer["addressInput"]!.zipcode
        ? address.answer["addressInput"]!.zipcode
        : "";
    return {
      workflow: state.survey.workflow,
      zipcode,
    };
  })(withNavigation(LinkComponent));

export const linkConfig: Map<string, LinkConfig> = new Map<string, LinkConfig>([
  [
    "haveKitAlready",
    {
      action: ({ navigation, dispatch, workflow }) => {
        dispatch(
          setWorkflow({
            ...workflow,
            skippedScreeningAt: new Date().toISOString(),
          })
        );
        navigation.push("WelcomeBack");
      },
      key: "haveKitAlready",
    },
  ],
  [
    "learnMore",
    {
      action: () => learnMore(),
      key: "learnMore",
    },
  ],
  [
    "findMedHelp",
    {
      action: () => findMedHelp(),
      key: "findMedHelp",
    },
  ],
  [
    "inputManually",
    {
      action: ({ navigation }) => navigation.push("ManualEntry"),
      key: "inputManually",
    },
  ],
  [
    "supportCode",
    {
      action: ({ dispatch }) => dispatch(toggleSupportCodeModal()),
      key: "supportCode",
    },
  ],
  [
    "kitMissingItems",
    {
      action: () => emailSupport("?subject=Kit missing items"),
      key: "kitMissingItems",
    },
  ],
  [
    "skipTestStripPhoto",
    {
      action: ({ navigation }) => navigation.push("CleanFirstTest"),
      key: "skipTestStripPhoto",
    },
  ],
  [
    "showNearbyUsps",
    {
      action: ({ zipcode }) => showNearbyShippingLocations(zipcode),
      key: "showNearbyUsps",
    },
  ],
]);
