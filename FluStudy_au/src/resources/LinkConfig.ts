// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Linking } from "react-native";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import { Constants } from "expo";
import { logFirebaseEvent, AppEvents } from "../util/tracker";
import i18n from "i18next";

const ausGovUrl = "https://beta.health.gov.au/health-topics/flu-influenza";
const CDCUrl = "https://www.cdc.gov/flu/treatment/whatyoushould.htm";
const myDrUrl =
  "https://www.mydr.com.au/respiratory-health/influenza-treatment";
export const followUpSurveyUrl =
  "https://uwhealth.az1.qualtrics.com/jfe/form/SV_3UEQ8IVCZwLPTP7";

const testQuestionsURL = "fluathome@adelaide.edu.au";
const appSupportURL = "flu-support-au@auderenow.org";

export function ausGov() {
  Linking.openURL(ausGovUrl);
}

export function CDC() {
  Linking.openURL(CDCUrl);
}

export function myDr() {
  Linking.openURL(myDrUrl);
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
    "changeResultAnswer",
    {
      action: ({ navigation }) => navigation.pop(),
      key: "changeResultAnswer",
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
