// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Linking, Platform } from "react-native";
import { connect } from "react-redux";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import { toggleSupportCodeModal, Action, StoreState } from "../store";
import { WorkflowInfo } from "audere-lib/coughProtocol";
import { getStore } from "../store";

const ausGovUrl = "https://beta.health.gov.au/health-topics/flu-influenza";
const CDCUrl = "https://www.cdc.gov/flu/treatment/whatyoushould.htm";
const learnMoreUrl = "http://fluathome.org/"; // Site currently only supports http, not https
const myDrUrl =
  "https://www.mydr.com.au/respiratory-health/influenza-treatment";

function createMapQueryUrl(query: string) {
  const scheme = Platform.select({ ios: "maps:0,0?q=", android: "geo:0,0?q=" });
  const encodedQuery = encodeURIComponent(query);
  const url = `${scheme}${encodedQuery}`;

  return url;
}

export function ausGov() {
  Linking.openURL(ausGovUrl);
}

export function CDC() {
  Linking.openURL(CDCUrl);
}

export function myDr() {
  Linking.openURL(myDrUrl);
}

export async function emailSupport(title: string) {
  console.log(title);
  const barcode = (await getStore()).getState().survey.kitBarcode;
  const body = !!barcode
    ? `Regarding kit ${
        barcode.code
      } (Please leave this line in your email message so we can find your record when you contact support.)`
    : "";
  const subject = !!barcode ? `Regarding kit ${barcode.code}` : "";
  Linking.openURL(`mailto:${title}?subject=${subject}&body=${body}`);
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
    return {
      workflow: state.survey.workflow,
    };
  })(withNavigation(LinkComponent));

export const linkConfig: Map<string, LinkConfig> = new Map<string, LinkConfig>([
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
    "skipTestStripPhoto",
    {
      action: ({ navigation }) => navigation.push("CleanFirstTest"),
      key: "skipTestStripPhoto",
    },
  ],
  [
    "ausGov",
    {
      action: () => ausGov(),
      key: "ausGov",
    },
  ],
  [
    "CDC",
    {
      action: () => CDC(),
      key: "CDC",
    },
  ],
  [
    "myDr",
    {
      action: () => myDr(),
      key: "myDr",
    },
  ],
]);
