// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Linking } from "react-native";
import {
  withNavigation,
  NavigationScreenProp,
  StackActions,
} from "react-navigation";
import Constants from "expo-constants";
import { logFirebaseEvent, AppEvents } from "../util/tracker";
import i18n from "i18next";

const CDCUrl = "https://www.cdc.gov/flu/treatment/whatyoushould.htm";
export const followUpSurveyUrl =
  "https://uwhealth.az1.qualtrics.com/jfe/form/SV_3UEQ8IVCZwLPTP7";

const testQuestionsURL = "fluathome@adelaide.edu.au";
const appSupportURL = "flu-support-au@auderenow.org";

export function CDC() {
  Linking.openURL(CDCUrl);
}

export function testSupport() {
  logFirebaseEvent(AppEvents.LINK_PRESSED, { link: testQuestionsURL });
  Linking.openURL(
    `mailto:${testQuestionsURL}?body=${i18n.t("links:supportBody") +
      Constants.installationId}`
  );
}

export function appSupport() {
  logFirebaseEvent(AppEvents.LINK_PRESSED, { link: appSupportURL });
  Linking.openURL(
    `mailto:${appSupportURL}?body=${i18n.t("links:supportBody") +
      Constants.installationId}`
  );
}

export function callNumber(phoneNumber: string) {
  const cleanedPhoneNumber = phoneNumber.replace(/[^0-9.]/, "");
  Linking.openURL(`tel:${cleanedPhoneNumber}`);
}

export interface LinkConfigProps {
  navigation: NavigationScreenProp<any, any>;
}

export interface LinkConfig {
  action: (props: LinkConfigProps) => void;
  key: string;
}

export const LinkPropProvider = (LinkComponent: any) =>
  withNavigation(LinkComponent);

export const linkConfig: Map<string, LinkConfig> = new Map<string, LinkConfig>([
  [
    "inputManually",
    {
      action: ({ navigation }) =>
        navigation.dispatch(StackActions.push({ routeName: "ManualEntry" })),
      key: "inputManually",
    },
  ],
  [
    "skipTestStripPhoto",
    {
      action: ({ navigation }) =>
        navigation.dispatch(StackActions.push({ routeName: "CleanFirstTest" })),
      key: "skipTestStripPhoto",
    },
  ],
  [
    "CDC",
    {
      action: () => CDC(),
      key: "CDC",
    },
  ],
]);
