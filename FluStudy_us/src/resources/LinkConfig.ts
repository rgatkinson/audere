// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Linking } from "react-native";
import {
  withNavigation,
  NavigationScreenProp,
  StackActions,
  NavigationActions,
} from "react-navigation";
import Constants from "expo-constants";
import { logFirebaseEvent, AppEvents } from "../util/tracker";
import i18n from "i18next";

const CDCUrl = "https://www.cdc.gov/flu/treatment/whatyoushould.htm";
const FedExUrl = "https://local.fedex.com/";
const testSupportURL = "study+homekit2020@myachievement.com";
const testSupportPhone = "4154171905";

export function CDC() {
  Linking.openURL(CDCUrl);
}

export function testSupport() {
  logFirebaseEvent(AppEvents.LINK_PRESSED, { link: testSupportURL });
  Linking.openURL(
    `mailto:${testSupportURL}?body=${i18n.t("links:supportBody") +
      Constants.installationId}`
  );
}

export function callSupport() {
  logFirebaseEvent(AppEvents.LINK_PRESSED, { link: testSupportPhone });
  Linking.openURL(`tel:${testSupportPhone}`);
}

export function callNumber(
  title: string,
  navigation: NavigationScreenProp<any, any>,
  target: string
) {
  const phoneNumber = !!target ? target : title;
  const cleanedPhoneNumber = phoneNumber.replace(/[^0-9.]/, "");
  Linking.openURL(`tel:${cleanedPhoneNumber}`);
}

export function emailAddress(email: string) {
  Linking.openURL(`mailto:${email}`);
}

export function contactSupport(
  title: string,
  navigation: NavigationScreenProp<any, any>
) {
  navigation.dispatch(
    NavigationActions.navigate({ routeName: "ContactSupport" })
  );
}

export function pushNavigate(
  title: string,
  navigation: NavigationScreenProp<any, any>,
  target: string
) {
  navigation.dispatch(StackActions.push({ routeName: target }));
}

export function dropOffPackage(
  title: string,
  navigation: NavigationScreenProp<any, any>,
  target: string
) {
  Linking.openURL(FedExUrl + target);
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
