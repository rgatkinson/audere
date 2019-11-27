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
import { GUTTER } from "../ui/styles";
import { testSupport, callSupport } from "./LinkConfig";
import Button from "../ui/components/Button";
import { AppEvents } from "../util/tracker";
import { getDevice } from "../transport/DeviceInfo";

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
  "howSoon",
  "howComplete",
  "howFindOut",
  "howLongTest",
  "swabDirty",
  "swabTubeLonger",
  "stripLonger",
  "whyPersonal",
  "willConfidential",
  "whySendBack",
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
        textVariablesFn: getDevice,
        namespace: key,
        appEvent: AppEvents.FAQ_PRESSED,
      },
    };
  });
}

export const MenuScreens: ScreenConfig[] = [
  menuScreen("Funding"),
  menuScreen("GeneralQuestions", false, getFAQComponents("GeneralQuestions")),
  menuScreen("ContactSupport", true, [
    {
      tag: Button,
      props: {
        enabled: true,
        primary: true,
        label: "emailSupport",
        onPress: testSupport,
        style: {
          marginVertical: GUTTER,
          alignSelf: "center",
        },
      },
    },
    {
      tag: Button,
      props: {
        enabled: true,
        primary: true,
        label: "callSupport",
        onPress: callSupport,
        style: {
          alignSelf: "center",
        },
      },
    },
  ]),
  menuScreen("ReportComplaint"),
  menuScreen("Version", true, [{ tag: BuildInfo }]),
];
