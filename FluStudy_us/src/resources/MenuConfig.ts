// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Component, ScreenConfig } from "../ui/components/Screen";
import BuildInfo from "../ui/components/BuildInfo";
import MainImage from "../ui/components/MainImage";
import ScreenText from "../ui/components/ScreenText";
import CollapsibleText from "../ui/components/CollapsibleText";
import Title from "../ui/components/Title";
import { PRIMARY_COLOR } from "../ui/styles";
import { testSupport } from "./LinkConfig";
import Button from "../ui/components/Button";
import { AppEvents } from "../util/tracker";

function menuScreen(
  key: string,
  hasDesc: boolean = true,
  components: Component[] = []
): ScreenConfig {
  const topSection: Component[] = [
    { tag: MainImage, props: { menuItem: true, uri: "colorlogo" } },
    { tag: Title },
  ];
  const body: Component[] = hasDesc
    ? topSection.concat({ tag: ScreenText, props: { label: "description" } })
    : topSection;

  return {
    body: body.concat(components),
    chromeProps: { menuItem: true },
    key,
  };
}

const FAQS = [
  "whyStudy",
  "howHelps",
  "howSoon",
  "howComplete",
  "howFindOut",
  "howLongTest",
  "swabDirty",
  "swabTubeLonger",
  "stripLonger",
  "whyPersonal",
  "willConfidential",
  "appDelete",
];
const FAQ_ANSWER_SUFFIX = "++Answer";

function getFAQComponents(key: string): Component[] {
  return FAQS.map(q => {
    return {
      tag: CollapsibleText,
      props: {
        titleLabel: q,
        bodyLabel: q + FAQ_ANSWER_SUFFIX,
        namespace: key,
        appEvent: AppEvents.FAQ_PRESSED,
      },
    };
  });
}

export const MenuScreens: ScreenConfig[] = [
  menuScreen("Funding"),
  menuScreen("GeneralQuestions", false, getFAQComponents("GeneralQuestions")),
  menuScreen("ReportComplaint"),
  menuScreen("ContactSupport", true, [
    {
      tag: Button,
      props: {
        enabled: true,
        primary: false,
        label: "emailSupport",
        onPress: testSupport,
        style: {
          borderWidth: 2,
          borderColor: PRIMARY_COLOR,
          //borderRadius: 50,
          alignSelf: "center",
        },
        textStyle: { color: PRIMARY_COLOR },
      },
    },
  ]),
  menuScreen("Version", false, [
    {
      tag: ScreenText,
      props: {
        label: "description",
        center: true,
      },
    },
    { tag: BuildInfo },
  ]),
];
