// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Linking, Platform } from "react-native";
import { connect } from "react-redux";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import { toggleSupportCodeModal, Action, StoreState } from "../store";
import { WorkflowInfo } from "audere-lib/feverProtocol";

const learnMoreUrl = "http://fluathome.org/"; // Site currently only supports http, not https

function createMapQueryUrl(query: string) {
  const scheme = Platform.select({ ios: "maps:0,0?q=", android: "geo:0,0?q=" });
  const encodedQuery = encodeURIComponent(query);
  const url = `${scheme}${encodedQuery}`;

  return url;
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
]);
