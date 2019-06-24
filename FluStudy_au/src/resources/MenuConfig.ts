// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Component, ScreenConfig } from "../ui/components/Screen";
import BuildInfo from "../ui/components/BuildInfo";
import MainImage from "../ui/components/MainImage";
import ScreenText from "../ui/components/ScreenText";
import Subtitle from "../ui/components/Subtitle";
import Title from "../ui/components/Title";
import Divider from "../ui/components/Divider";
import ContinueButton from "../ui/components/ContinueButton";
import { PRIMARY_COLOR, LARGE_TEXT } from "../ui/styles";
import { testSupport, appSupport } from "./LinkConfig";

function menuScreen(
  key: string,
  subtitle: string,
  components: Component[] = []
): ScreenConfig {
  const body: Component[] = [
    { tag: MainImage, props: { menuItem: true, uri: "colorlogo" } },
    { tag: Title },
    { tag: ScreenText, props: { label: "description" } },
  ];

  return {
    body: body.concat(components),
    chromeProps: { menuItem: true },
    key,
  };
}

export const MenuScreens: ScreenConfig[] = [
  menuScreen("Funding", "about"),
  menuScreen("GeneralQuestions", "about"),
  {
    body: [
      { tag: MainImage, props: { menuItem: true, uri: "colorlogo" } },
      { tag: Subtitle, props: { label: "contactSupport" } },
      {
        tag: ScreenText,
        props: {
          label: "testStudy",
          center: true,
          bold: true,
          style: { fontSize: LARGE_TEXT, color: PRIMARY_COLOR },
        },
      },
      {
        tag: ScreenText,
        props: {
          label: "testStudyDesc",
        },
      },
      {
        tag: ContinueButton,
        props: {
          enabled: true,
          primary: false,
          label: "emailTestSupport",
          onPress: () => testSupport(),
          style: {
            borderWidth: 2,
            borderColor: PRIMARY_COLOR,
            borderRadius: 50,
            alignSelf: "center",
          },
          textStyle: { color: PRIMARY_COLOR },
        },
      },
      { tag: Divider },
      {
        tag: ScreenText,
        props: {
          label: "appSupport",
          center: true,
          bold: true,
          style: { fontSize: LARGE_TEXT, color: PRIMARY_COLOR },
        },
      },
      {
        tag: ScreenText,
        props: {
          label: "appSupportDesc",
        },
      },
      {
        tag: ContinueButton,
        props: {
          enabled: true,
          primary: false,
          label: "emailAppSupport",
          onPress: () => appSupport(),
          style: {
            borderWidth: 2,
            borderColor: PRIMARY_COLOR,
            borderRadius: 50,
            alignSelf: "center",
          },
          textStyle: { color: PRIMARY_COLOR },
        },
      },
    ],
    chromeProps: { menuItem: true },
    key: "ContactSupport",
  },
  menuScreen("Report", "about"),
  menuScreen("Version", "help", [{ tag: BuildInfo }]),
];
