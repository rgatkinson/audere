// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import {
  setConsent,
  setTenMinuteStartTime,
  setOneMinuteStartTime,
} from "../store";
import { FunnelEvents } from "../util/tracker";
import { getFluResultScreen, logFluResult } from "../util/fluResults";
import {
  WhatSymptomsConfig,
  WhenSymptomsConfig,
  GeneralExposureConfig,
  GeneralHealthConfig,
  TestFeedbackConfig,
  TestStripSurveyConfig,
  InfluenzaVaccinationConfig,
} from "./QuestionConfig";
import { ScreenConfig } from "../ui/components/Screen";
import Barcode from "../ui/components/flu/Barcode";
import BarcodeScanner from "../ui/components/BarcodeScanner";
import BarcodeEntry from "../ui/components/flu/BarcodeEntry";
import BulletPointsComponent from "../ui/components/BulletPoint";
import ConsentText from "../ui/components/ConsentText";
import CameraPermissionContinueButton from "../ui/components/CameraPermissionContinueButton";
import ContinueButton from "../ui/components/ContinueButton";
import Divider from "../ui/components/Divider";
import Links from "../ui/components/Links";
import MainImage from "../ui/components/MainImage";
import Questions from "../ui/components/Questions";
import RDTImage from "../ui/components/flu/RDTImage";
import RDTReader from "../ui/components/flu/RDTReader";
import ScreenText from "../ui/components/ScreenText";
import SupportCodeModal from "../ui/components/flu/SupportCodeModal";
import TestResult from "../ui/components/flu/TestResult";
import TestResultExplanation from "../ui/components/flu/TestResultExplanation";
import TestStripCamera from "../ui/components/flu/TestStripCamera";
import Timer from "../ui/components/Timer";
import Title from "../ui/components/Title";
import VideoPlayer from "../ui/components/VideoPlayer";
import FooterNavigation from "../ui/components/FooterNavigation";

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const TEST_STRIP_MS = 10 * MINUTE_MS;
const CAN_USE_RDT = !DeviceInfo.isEmulator();

export const Screens: ScreenConfig[] = [
  {
    body: [{ tag: Title }, { tag: ScreenText, props: { label: "desc" } }],
    chromeProps: { hideBackButton: true, splashImage: "welcome" },
    key: "Welcome",
    footer: [
      {
        tag: FooterNavigation,
        props: {
          next: "WhatsRequired",
          hideBackButton: true,
          stepDots: { step: 1, total: 3 },
        },
      },
    ],
  },
  {
    body: [{ tag: Title }, { tag: ScreenText, props: { label: "desc" } }],
    chromeProps: { hideBackButton: true, splashImage: "whatsrequired" },
    key: "WhatsRequired",
    footer: [
      {
        tag: FooterNavigation,
        props: { next: "ReadyToBegin", stepDots: { step: 2, total: 3 } },
      },
    ],
  },
  {
    body: [{ tag: Title }, { tag: ScreenText, props: { label: "desc" } }],
    chromeProps: { hideBackButton: true, splashImage: "readytobegin" },
    key: "ReadyToBegin",
    footer: [
      {
        tag: FooterNavigation,
        props: { next: "Consent", stepDots: { step: 3, total: 3 } },
      },
    ],
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
      { tag: MainImage, props: { uri: "scanbarcode" } },
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
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      { tag: BarcodeEntry, validate: true },
    ],
    footer: [{ tag: ContinueButton, props: { next: "ManualConfirmation" } }],
    key: "ManualEntry",
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
      { tag: MainImage, props: { uri: "setupkitbox" } },
      { tag: Title },
      {
        tag: BulletPointsComponent,
        props: { label: "desc", customBulletUri: "listarrow" },
      },
    ],
    footer: [{ tag: ContinueButton, props: { next: "Swab" } }],
    key: "Unpacking",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "preparetube" } },
      { tag: Title },
      {
        tag: BulletPointsComponent,
        props: { label: "desc", customBulletUri: "listarrow" },
      },
    ],
    footer: [{ tag: ContinueButton, props: { next: "OpenSwab" } }],
    key: "Swab",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "opennasalswab" } },
      { tag: Title },
      {
        tag: BulletPointsComponent,
        props: { label: "desc", customBulletUri: "listarrow" },
      },
    ],
    footer: [{ tag: ContinueButton, props: { next: "Mucus" } }],
    key: "OpenSwab",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "collectmucus" } },
      { tag: Title },
      {
        tag: BulletPointsComponent,
        props: { label: "desc", customBulletUri: "listarrow" },
      },
      { tag: VideoPlayer, props: { id: "collectSample" } },
    ],
    footer: [{ tag: ContinueButton, props: { next: "SwabInTube" } }],
    key: "Mucus",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "putswabintube" } },
      { tag: Title },
      {
        tag: BulletPointsComponent,
        props: { label: "desc", customBulletUri: "listarrow" },
      },
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
      { tag: MainImage, props: { uri: "oneminutetimer" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
    ],
    footer: [
      {
        tag: Timer,
        props: {
          next: "RemoveSwabFromTube",
          startTimeConfig: "oneMinuteStartTime",
          totalTimeMs: MINUTE_MS,
        },
      },
    ],
    key: "FirstTimer",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "removeswabfromtube" } },
      { tag: Title },
      {
        tag: BulletPointsComponent,
        props: { label: "desc", customBulletUri: "listarrow" },
      },
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
      {
        tag: BulletPointsComponent,
        props: { label: "desc", customBulletUri: "listarrow" },
      },
    ],
    footer: [{ tag: ContinueButton, props: { next: "StripInTube" } }],
    key: "OpenTestStrip",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "putteststripintube" } },
      { tag: Title },
      {
        tag: BulletPointsComponent,
        props: { label: "desc", customBulletUri: "listarrow" },
      },
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
      { tag: Title },
      { tag: ScreenText, props: { center: true, label: "desc" } },
      { tag: Divider },
      {
        tag: Questions,
        props: { questions: [WhatSymptomsConfig] },
        validate: true,
      },
    ],
    footer: [{ tag: ContinueButton, props: { next: "WhenSymptoms" } }],
    key: "WhatSymptoms",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { center: true, label: "desc" } },
      { tag: Divider },
      {
        tag: Questions,
        props: { questions: WhenSymptomsConfig },
        validate: true,
      },
    ],
    footer: [{ tag: ContinueButton, props: { next: "GeneralExposure" } }],
    key: "WhenSymptoms",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { center: true, label: "desc" } },
      { tag: Divider },
      { tag: ScreenText, props: { label: "expoDesc" } },
      { tag: MainImage, props: { uri: "generalexposure" } },
      { tag: ScreenText, props: { italic: true, label: "expoRef" } },
      {
        tag: Questions,
        props: { questions: GeneralExposureConfig },
        validate: true,
      },
    ],
    footer: [{ tag: ContinueButton, props: { next: "InfluenzaVaccination" } }],
    key: "GeneralExposure",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { center: true, label: "desc" } },
      { tag: Divider },
      {
        tag: Questions,
        props: { questions: InfluenzaVaccinationConfig },
      },
    ],
    footer: [{ tag: ContinueButton, props: { next: "GeneralHealth" } }],
    key: "InfluenzaVaccination",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { center: true, label: "desc" } },
      { tag: Divider },
      { tag: ScreenText, props: { center: true, label: "next" } },
      {
        tag: Questions,
        props: { questions: GeneralHealthConfig },
        validate: true,
      },
    ],
    footer: [{ tag: ContinueButton, props: { next: "ThankYouSurvey" } }],
    key: "GeneralHealth",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "questionsthankyou" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      { tag: ScreenText, props: { label: "waiting" } },
    ],
    footer: [
      {
        tag: Timer,
        props: {
          next: "TestStripReady",
          startTimeConfig: "tenMinuteStartTime",
          totalTimeMs: TEST_STRIP_MS,
        },
      },
    ],
    funnelEvent: FunnelEvents.COMPLETED_SURVEY,
    key: "ThankYouSurvey",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "removeteststrip" } },
      { tag: Title },
      {
        tag: BulletPointsComponent,
        props: { label: "desc", customBulletUri: "listarrow" },
      },
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
    body: [
      { tag: MainImage, props: { uri: "lookatteststrip" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: Questions,
        props: { questions: TestStripSurveyConfig, logOnSave: logFluResult },
        validate: true,
      },
    ],
    footer: [
      {
        tag: ContinueButton,
        props: { surveyGetNextFn: getFluResultScreen },
      },
    ],
    key: "TestStripSurvey",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "lookatteststrip" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      { tag: TestResult },
      { tag: ScreenText, props: { label: "why" } },
      { tag: TestResultExplanation },
      { tag: Links, props: { links: ["changeResultAnswer"] } },
      { tag: Divider },
      { tag: ScreenText, props: { label: "disclaimer" } },
    ],
    footer: [{ tag: ContinueButton, props: { next: "Advice" } }],
    key: "TestResult",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "defectiveteststrip" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
    ],
    footer: [{ tag: ContinueButton, props: { next: "CleanTest" } }],
    key: "InvalidResult",
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
    body: [
      { tag: MainImage, props: { uri: "cleanuptest" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
    ],
    footer: [{ tag: ContinueButton, props: { next: "TestFeedback" } }],
    key: "CleanTest",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "nicejob" } },
      { tag: Title },
      {
        tag: Questions,
        props: { questions: [TestFeedbackConfig] },
        validate: true,
      },
    ],
    footer: [{ tag: ContinueButton, props: { next: "Thanks" } }],
    key: "TestFeedback",
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
      {
        tag: BulletPointsComponent,
        props: { label: "desc", customBulletUri: "listarrow" },
      },
    ],
    footer: [
      {
        tag: CameraPermissionContinueButton,
        props: {
          grantedNext: CAN_USE_RDT ? "RDTReader" : "TestStripCamera",
          deniedNext: "CameraSettings",
        },
      },
    ],
    key: "RDTInstructions",
  },
  {
    body: [
      {
        tag: RDTReader,
        props: { next: "TestStripConfirmation", fallback: "TestStripCamera" },
      },
    ],
    key: "RDTReader",
  },
  {
    body: [
      {
        tag: TestStripCamera,
        props: { next: "TestStripConfirmation" },
      },
    ],
    key: "TestStripCamera",
  },
];
