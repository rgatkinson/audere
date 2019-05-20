// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Component, ScreenConfig } from "../ui/components/Screen";
import BuildInfo from "../ui/components/BuildInfo";
import MainImage from "../ui/components/MainImage";
import ScreenImages from "../ui/components/ScreenImages";
import ScreenText from "../ui/components/ScreenText";
import Subtitle from "../ui/components/Subtitle";
import Title from "../ui/components/Title";

function menuScreen(
  key: string,
  subtitle: string,
  components: Component[] = []
): ScreenConfig {
  const body: Component[] = [
    { tag: MainImage, props: { menuItem: true, uri: "colorlogo" } },
    { tag: Subtitle, props: { label: subtitle } },
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
  menuScreen("About", "about"),
  menuScreen("Funding", "about"),
  menuScreen("Partners", "about", [
    { tag: ScreenImages, props: { images: ["brotman", "uwmed", "fredhutch"] } },
  ]),
  menuScreen("GeneralQuestions", "help"),
  menuScreen("Problems", "help"),
  menuScreen("TestQuestions", "help"),
  menuScreen("ContactSupport", "help"),
  menuScreen("Version", "help", [{ tag: BuildInfo }]),
];
