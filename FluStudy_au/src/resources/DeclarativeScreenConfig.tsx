// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Platform } from "react-native";
import {
  setConsent,
  setTenMinuteStartTime,
  setOneMinuteStartTime,
} from "../store";
import { FunnelEvents, AppHealthEvents } from "../util/tracker";
import { DeclarativeScreenConfig } from "../ui/components/DeclarativeScreen";
import Barcode from "../ui/components/flu/Barcode";
import BarcodeScanner from "../ui/components/BarcodeScanner";
import { BulletPoints } from "../ui/components/BulletPoint";
import ConsentText from "../ui/components/ConsentText";
import CameraPermissionContinueButton from "../ui/components/CameraPermissionContinueButton";
import ContinueButton from "../ui/components/ContinueButton";
import Links from "../ui/components/Links";
import MainImage from "../ui/components/MainImage";
import RDTImage from "../ui/components/flu/RDTImage";
import ScreenText from "../ui/components/ScreenText";
import SupportCodeModal from "../ui/components/flu/SupportCodeModal";
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
      { tag: Title },
      { tag: ScreenText, props: { center: true, label: "desc" } },
      { tag: ConsentText },
    ],
    key: "Consent",
    footer: [
      {
        tag: ContinueButton,
        props: {
          dispatchOnNext: () => setConsent(),
          label: "accept",
          next: "ScanInstructions",
        },
      },
    ],
  },
  {
    body: [
      { tag: MainImage, props: { uri: "barcodeonbox" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
    ],
    footer: [
      {
        tag: CameraPermissionContinueButton,
        props: { grantedNext: "Scan", deniedNext: "ManualEntry" },
      },
    ],
    funnelEvent: FunnelEvents.CONSENT_COMPLETED,
    key: "ScanInstructions",
  },
  {
    body: [
      {
        tag: BarcodeScanner,
        props: {
          next: "ScanConfirmation",
          timeoutScreen: "ManualEntry",
          errorScreen: "BarcodeContactSupport",
        },
      },
    ],
    key: "Scan",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "barcodesuccess" } },
      { tag: Title },
      { tag: Barcode },
      { tag: ScreenText, props: { label: "desc" } },
    ],
    footer: [{ tag: ContinueButton, props: { next: "Unpacking" } }],
    funnelEvent: FunnelEvents.SCAN_CONFIRMATION,
    key: "ScanConfirmation",
    workflowEvent: "surveyStartedAt",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "barcodesuccess" } },
      { tag: Title },
      { tag: Barcode },
      { tag: ScreenText, props: { label: "desc" } },
    ],
    footer: [{ tag: ContinueButton, props: { next: "Unpacking" } }],
    funnelEvent: FunnelEvents.SCAN_CONFIRMATION,
    key: "ManualConfirmation",
    workflowEvent: "surveyStartedAt",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "contactsupport" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      { tag: SupportCodeModal },
    ],
    chromeProps: { hideBackButton: true },
    footer: [{ tag: Links, props: { center: true, links: ["supportCode"] } }],
    key: "BarcodeContactSupport",
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
  {
    body: [
      { tag: MainImage, props: { uri: "opennasalswab" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
    ],
    footer: [{ tag: ContinueButton, props: { next: "Mucus" } }],
    key: "OpenSwab",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "collectmucus" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      { tag: VideoPlayer, props: { id: "collectSample" } },
    ],
    footer: [{ tag: ContinueButton, props: { next: "SwabInTube" } }],
    key: "Mucus",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "putswabintube" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
    ],
    footer: [
      {
        tag: ContinueButton,
        props: {
          dispatchOnNext: () => setOneMinuteStartTime(),
          label: "startTimer",
          next: "FirstTimer",
        },
      },
    ],
    funnelEvent: FunnelEvents.SURVIVED_FIRST_SWAB,
    key: "SwabInTube",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "removeswabfromtube" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      { tag: VideoPlayer, props: { id: "removeSwabFromTube" } },
    ],
    footer: [{ tag: ContinueButton, props: { next: "OpenTestStrip" } }],
    funnelEvent: FunnelEvents.PASSED_FIRST_TIMER,
    key: "RemoveSwabFromTube",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "openteststrip" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      { tag: VideoPlayer, props: { id: "openTestStrip" } },
    ],
    footer: [{ tag: ContinueButton, props: { next: "StripInTube" } }],
    key: "OpenTestStrip",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "openteststrip_1" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      { tag: VideoPlayer, props: { id: "putTestStripInTube" } },
    ],
    footer: [
      {
        tag: ContinueButton,
        props: {
          dispatchOnNext: () => setTenMinuteStartTime(),
          next: "WhatSymptoms",
        },
      },
    ],
    key: "StripInTube",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "removeteststrip" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      { tag: VideoPlayer, props: { id: "removeTestStrip" } },
    ],
    footer: [{ tag: ContinueButton, props: { next: "RDTInstructions" } }],
    key: "TestStripReady",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "updatesettings" } },
      { tag: Title },
      {
        tag: ScreenText,
        props: { label: Platform.OS === "android" ? "descAndroid" : "desc" },
      },
    ],
    key: "CameraSettings",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      { tag: RDTImage },
    ],
    footer: [{ tag: ContinueButton, props: { next: "TestStripSurvey" } }],
    key: "TestStripConfirmation",
  },
  {
    body: [{ tag: Title }, { tag: ScreenText, props: { label: "desc" } }],
    footer: [{ tag: ContinueButton, props: { next: "Advice" } }],
    key: "TestResult",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      { tag: Links, props: { links: ["ausGov", "CDC", "myDr"] } },
    ],
    footer: [{ tag: ContinueButton, props: { next: "CleanTest" } }],
    key: "Advice",
  },
  {
    body: [{ tag: Title }, { tag: ScreenText, props: { label: "desc" } }],
    footer: [{ tag: ContinueButton, props: { next: "TestFeedback" } }],
    key: "CleanTest",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "finalthanks" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
    ],
    key: "Thanks",
    workflowEvent: "surveyCompletedAt",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "takepictureteststrip" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
    ],
    footer: [
      {
        tag: CameraPermissionContinueButton,
        props: { grantedNext: "RDTReader", deniedNext: "CameraSettings" },
      },
    ],
    key: "RDTInstructions",
  },
];
