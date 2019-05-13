// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { DeclarativeScreenConfig } from "../ui/components/DeclarativeScreen";
import { BulletPoints } from "../ui/components/BulletPoint";
import ContinueButton from "../ui/components/ContinueButton";
import MainImage from "../ui/components/MainImage";
import ScreenText from "../ui/components/ScreenText";
import Title from "../ui/components/Title";
import VideoPlayer from "../ui/components/VideoPlayer";

export const declarativeScreens: DeclarativeScreenConfig[] = [
  {
    body: [{ tag: Title }, { tag: ScreenText, props: { label: "desc" } }],
    chromeProps: { hideBackButton: true, splashImage: "welcome" },
    key: "Welcome",
    footer: [{ tag: ContinueButton, props: { next: "PreConsent" } }],
  },
  {
    body: [
      { tag: MainImage, props: { uri: "preconsent" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      { tag: BulletPoints },
      { tag: ScreenText, props: { label: "questions" } },
      { tag: ScreenText, props: { label: "continue", italic: true } },
    ],
    key: "PreConsent",
    footer: [{ tag: ContinueButton, props: { next: "Consent" } }],
  },
  {
    body: [
      { tag: MainImage, props: { uri: "unpackinginstructions" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
    ],
    footer: [{ tag: ContinueButton, props: { next: "Swab" } }],
    key: "Unpacking",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "begin1sttest" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      { tag: VideoPlayer, props: { id: "beginFirstTest" } },
    ],
    footer: [{ tag: ContinueButton, props: { next: "OpenSwab" } }],
    key: "Swab",
  },
];
