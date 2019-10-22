// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  AchesLast48Config,
  AchesSeverityConfig,
  AchesStartConfig,
  AgeConfig,
  AntibioticsConfig,
  AntiviralConfig,
  AssignedSexConfig,
  BedroomsConfig,
  BlueLineConfig,
  ChildrenWithChildrenConfig,
  ChillsLast48Config,
  ChillsSeverityConfig,
  ChillsStartConfig,
  CoughLast48Config,
  CoughSeverityConfig,
  CoughSneezeConfig,
  CoughStartConfig,
  FatigueLast48Config,
  FatigueSeverityConfig,
  FatigueStartConfig,
  FeverLast48Config,
  FeverSeverityConfig,
  FeverStartConfig,
  FluShotConfig,
  FluShotDateConfig,
  HeadacheLast48Config,
  HeadacheSeverityConfig,
  HeadacheStartConfig,
  HealthCareWorkerConfig,
  HouseholdChildrenConfig,
  HouseholdTobaccoConfig,
  InContactConfig,
  InterferingConfig,
  MedicalConditionConfig,
  PeopleInHouseholdConfig,
  PinkWhenBlueConfig,
  PreviousSeason,
  RaceConfig,
  RunningNoseLast48Config,
  RunningNoseSeverityConfig,
  RunningNoseStartConfig,
  ShortBreathLast48Config,
  ShortBreathSeverityConfig,
  ShortBreathStartConfig,
  SmokeTobaccoConfig,
  SoreThroatLast48Config,
  SoreThroatSeverityConfig,
  SoreThroatStartConfig,
  SymptomsLast48Config,
  SymptomsSeverityConfig,
  SymptomsStartConfig,
  VomitingLast48Config,
  VomitingSeverityConfig,
  VomitingStartConfig,
  WhatSymptomsConfig,
  YoungChildrenConfig,
} from "audere-lib/chillsQuestionConfig";
import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import {
  setHasBeenOpened,
  setOneMinuteStartTime,
  setTenMinuteStartTime,
  setTenMinuteTimerDone,
  setTotalTestStripTime,
} from "../store";
import BarcodeScanner from "../ui/components/BarcodeScanner";
import BulletPointsComponent from "../ui/components/BulletPoint";
import Button from "../ui/components/Button";
import CameraPermissionContinueButton from "../ui/components/CameraPermissionContinueButton";
import CollapsibleText from "../ui/components/CollapsibleText";
import ContinueButton from "../ui/components/ContinueButton";
import DidYouKnow from "../ui/components/DidYouKnow";
import Divider from "../ui/components/Divider";
import EmailEntry from "../ui/components/EmailEntry";
import Barcode from "../ui/components/flu/Barcode";
import BarcodeEntry from "../ui/components/flu/BarcodeEntry";
import RDTImage from "../ui/components/flu/RDTImage";
import AndroidRDTReader from "../ui/components/flu/AndroidRDTReader";
import RDTReader from "../ui/components/flu/RDTReader";
import TestResult from "../ui/components/flu/TestResult";
import TestResultRDT from "../ui/components/flu/TestResultRDT";
import TestStripCamera from "../ui/components/flu/TestStripCamera";
import LinkInfoBlock from "../ui/components/LinkInfoBlock";
import Links from "../ui/components/Links";
import MainImage from "../ui/components/MainImage";
import PendingButton from "../ui/components/PendingButton";
import Questions from "../ui/components/Questions";
import { ScreenConfig } from "../ui/components/Screen";
import ScreenText from "../ui/components/ScreenText";
import SelectableComponent from "../ui/components/SelectableComponent";
import Timer from "../ui/components/Timer";
import Title from "../ui/components/Title";
import VideoPlayer from "../ui/components/VideoPlayer";
import { SMALL_TEXT } from "../ui/styles";
import {
  getPinkWhenBlueNextScreen,
  getTestStripSurveyNextScreen,
  logFluResult,
} from "../util/fluResults";
import { openSettingsApp } from "../util/openSettingsApp";
import { pendingNavigation, uploadPendingSuccess } from "../util/pendingData";
import { getShippingTextVariables } from "../util/shipping";
import { FunnelEvents } from "../util/tracker";

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const TEST_STRIP_MS = 10 * MINUTE_MS;
const CAN_USE_RDT = !DeviceInfo.isEmulator();

export const Screens: ScreenConfig[] = [
  {
    backgroundColor: "transparent",
    body: [
      { tag: MainImage, props: { uri: "welcome", useForChrome: true } },
      { tag: Title, props: { center: false, color: "white" } },
      { tag: ScreenText, props: { label: "desc", style: { color: "white" } } },
      {
        tag: BulletPointsComponent,
        props: {
          label: "desc2",
          customBulletUri: "bullet_rev",
          textStyle: { color: "white" },
        },
      },
      {
        tag: ContinueButton,
        props: {
          next: "HowDoesTestWork",
          textStyle: { color: "white" },
        },
      },
    ],
    chromeProps: {
      dispatchOnFirstLoad: [setHasBeenOpened],
      hideBackButton: true,
      showBackgroundOnly: true,
      fadeIn: true,
    },
    automationNext: "HowDoesTestWork",
    key: "Welcome",
  },
  {
    backgroundColor: "transparent",
    body: [
      { tag: MainImage, props: { uri: "welcome", useForChrome: true } },
      { tag: Title, props: { center: false, color: "white" } },
      { tag: ScreenText, props: { label: "desc", style: { color: "white" } } },
      {
        tag: ContinueButton,
        props: {
          next: "HowAmIHelping",
          textStyle: { color: "white" },
        },
      },
    ],
    chromeProps: { showBackgroundOnly: true },
    automationNext: "HowAmIHelping",
    key: "HowDoesTestWork",
  },
  {
    backgroundColor: "transparent",
    body: [
      { tag: MainImage, props: { uri: "welcome", useForChrome: true } },
      { tag: Title, props: { center: false, color: "white" } },
      { tag: ScreenText, props: { label: "desc", style: { color: "white" } } },
      {
        tag: BulletPointsComponent,
        props: {
          label: "desc2",
          customBulletUri: "bullet_rev",
          textStyle: { color: "white" },
        },
      },
      { tag: ScreenText, props: { label: "desc3", style: { color: "white" } } },
      {
        tag: BulletPointsComponent,
        props: {
          label: "desc4",
          customBulletUri: "bullet_rev",
          textStyle: { color: "white" },
        },
      },
      {
        tag: ContinueButton,
        props: {
          next: "WhatExpectToLearn",
          textStyle: { color: "white" },
        },
      },
    ],
    chromeProps: { showBackgroundOnly: true },
    automationNext: "WhatExpectToLearn",
    key: "HowAmIHelping",
  },
  {
    backgroundColor: "transparent",
    body: [
      { tag: MainImage, props: { uri: "welcome", useForChrome: true } },
      { tag: Title, props: { center: false, color: "white" } },
      { tag: ScreenText, props: { label: "desc", style: { color: "white" } } },
      {
        tag: BulletPointsComponent,
        props: {
          label: "desc2",
          customBulletUri: "bullet_rev",
          textStyle: { color: "white" },
        },
      },
      { tag: ScreenText, props: { label: "desc3", style: { color: "white" } } },
      {
        tag: CollapsibleText,
        props: { content: "desc4", textStyle: { color: "white" } },
      },
      { tag: ScreenText, props: { label: "desc5", style: { color: "white" } } },
      {
        tag: ContinueButton,
        props: {
          next: "ResearchStudy",
          textStyle: { color: "white" },
        },
      },
    ],
    chromeProps: { showBackgroundOnly: true },
    automationNext: "ResearchStudy",
    key: "WhatExpectToLearn",
  },
  {
    backgroundColor: "transparent",
    body: [
      { tag: MainImage, props: { uri: "welcome", useForChrome: true } },
      { tag: Title, props: { center: false, color: "white" } },
      { tag: ScreenText, props: { label: "desc", style: { color: "white" } } },
      {
        tag: ContinueButton,
        props: {
          next: "ScanInstructions",
          textStyle: { color: "white" },
        },
      },
    ],
    chromeProps: { showBackgroundOnly: true },
    automationNext: "ScanInstructions",
    key: "ResearchStudy",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "scanbarcode" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: CameraPermissionContinueButton,
        props: {
          grantedNext: "Scan",
          deniedNext: "CameraSettings",
        },
      },
    ],
    automationNext: "ManualEntry",
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
      {
        tag: BarcodeEntry,
        validate: true,
        props: { errorScreen: "BarcodeContactSupport" },
      },
      { tag: MainImage, props: { uri: "scanbarcode" } },
      { tag: ScreenText, props: { label: "tips" } },
      {
        tag: ContinueButton,
        props: { next: "ManualConfirmation" },
      },
    ],
    key: "ManualEntry",
    keyboardAvoidingView: true,
  },
  {
    body: [
      { tag: MainImage, props: { uri: "barcodesuccess" } },
      { tag: Title },
      { tag: Barcode },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: ContinueButton,
        props: { next: "EmailConfirmation" },
      },
    ],
    funnelEvent: FunnelEvents.SCAN_CONFIRMATION,
    key: "ScanConfirmation", // TODO: Add Kit validation checks
    workflowEvent: "surveyStartedAt",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "barcodesuccess" } },
      { tag: Title },
      { tag: Barcode },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: ContinueButton,
        props: { next: "EmailConfirmation" },
      },
    ],
    funnelEvent: FunnelEvents.MANUAL_CODE_CONFIRMATION,
    key: "ManualConfirmation", // TODO: Add Kit validation checks
    workflowEvent: "surveyStartedAt",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "contactsupport" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      { tag: Links, props: { links: ["inputManually"] } },
    ],
    key: "BarcodeContactSupport",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      { tag: ScreenText, props: { label: "email" } },
      {
        tag: EmailEntry,
        props: { placeholder: "placeholder", errorScreen: "EmailError" },
        validate: true,
      },
      {
        tag: ContinueButton,
        props: { next: "Unpacking" },
      },
    ],
    key: "EmailConfirmation",
    keyboardAvoidingView: true,
  },
  {
    body: [{ tag: Title }, { tag: ScreenText, props: { label: "desc" } }],
    key: "EmailError",
    footer: [
      {
        tag: ContinueButton,
        props: {
          label: "common:button:yes",
          next: "ScanInstructions",
          showButtonStyle: true,
        },
      },
      {
        tag: ContinueButton,
        props: {
          label: "common:button:no",
          next: "BarcodeContactSupport",
          showButtonStyle: true,
        },
      },
    ],
  },
  {
    body: [
      { tag: MainImage, props: { uri: "setupkitbox" } },
      { tag: Title },
      {
        tag: BulletPointsComponent,
        props: { label: "desc" },
      },
      {
        tag: ContinueButton,
        props: { next: "Swab" },
      },
    ],
    key: "Unpacking",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "preparetube" } },
      { tag: Title },
      {
        tag: BulletPointsComponent,
        props: { label: "desc" },
      },
      {
        tag: ContinueButton,
        props: { next: "OpenSwab" },
      },
    ],
    key: "Swab",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "opennasalswab" } },
      { tag: Title },
      {
        tag: BulletPointsComponent,
        props: { label: "desc" },
      },
      {
        tag: ContinueButton,
        props: { next: "Mucus" },
      },
    ],
    key: "OpenSwab",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "collectmucus" } },
      { tag: Title },
      {
        tag: BulletPointsComponent,
        props: { label: "desc" },
      },
      { tag: VideoPlayer, props: { id: "collectSample" } },
      {
        tag: ContinueButton,
        props: { next: "SwabInTube" },
      },
    ],
    key: "Mucus",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "putswabintube" } },
      { tag: Title },
      {
        tag: BulletPointsComponent,
        props: { label: "desc" },
      },
      {
        tag: ContinueButton,
        props: {
          dispatchOnNext: () => setOneMinuteStartTime(),
          label: "startTimer",
          next: "FirstTimer",
        },
      },
    ],
    funnelEvent: FunnelEvents.SURVIVED_SWAB,
    key: "SwabInTube",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "oneminutetimer" } },
      { tag: Title },
      {
        tag: DidYouKnow,
        props: {
          startTimeConfig: "oneMinuteStartTime",
          msPerItem: 10 * SECOND_MS,
        },
      },
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
        props: { label: "desc" },
      },
      { tag: VideoPlayer, props: { id: "removeSwabFromTube" } },
      {
        tag: ContinueButton,
        props: { next: "OpenTestStrip" },
      },
    ],
    funnelEvent: FunnelEvents.PASSED_FIRST_TIMER,
    key: "RemoveSwabFromTube",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "openteststrip" } },
      { tag: Title },
      {
        tag: BulletPointsComponent,
        props: { label: "desc" },
      },
      {
        tag: ContinueButton,
        props: { next: "StripInTube" },
      },
    ],
    key: "OpenTestStrip",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "putteststripintube" } },
      { tag: Title },
      {
        tag: BulletPointsComponent,
        props: { label: "desc" },
      },
      {
        tag: ContinueButton,
        props: {
          dispatchOnNext: () => setTenMinuteStartTime(),
          next: "WhatSymptoms",
          label: "startTimer",
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
      {
        tag: ContinueButton,
        props: { next: "WhenSymptoms" },
      },
    ],
    key: "WhatSymptoms",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { center: true, label: "desc" } },
      { tag: Divider },
      {
        tag: Questions,
        props: {
          questions: [
            SymptomsStartConfig,
            FeverStartConfig,
            CoughStartConfig,
            FatigueStartConfig,
            ChillsStartConfig,
            SoreThroatStartConfig,
            HeadacheStartConfig,
            AchesStartConfig,
            RunningNoseStartConfig,
            ShortBreathStartConfig,
            VomitingStartConfig,
            SymptomsLast48Config,
            FeverLast48Config,
            CoughLast48Config,
            FatigueLast48Config,
            ChillsLast48Config,
            SoreThroatLast48Config,
            HeadacheLast48Config,
            AchesLast48Config,
            RunningNoseLast48Config,
            ShortBreathLast48Config,
            VomitingLast48Config,
            SymptomsSeverityConfig,
            FeverSeverityConfig,
            CoughSeverityConfig,
            FatigueSeverityConfig,
            ChillsSeverityConfig,
            SoreThroatSeverityConfig,
            HeadacheSeverityConfig,
            AchesSeverityConfig,
            RunningNoseSeverityConfig,
            ShortBreathSeverityConfig,
            VomitingSeverityConfig,
          ],
        },
        validate: true,
      },
      {
        tag: ContinueButton,
        props: { next: "GeneralExposure" },
      },
    ],
    key: "WhenSymptoms",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { center: true, label: "desc" } },
      { tag: Divider },
      { tag: ScreenText, props: { label: "expoDesc" } },
      {
        tag: Questions,
        props: {
          questions: [
            InContactConfig,
            CoughSneezeConfig,
            YoungChildrenConfig,
            HouseholdChildrenConfig,
            ChildrenWithChildrenConfig,
            PeopleInHouseholdConfig,
            BedroomsConfig,
          ],
        },
        validate: true,
      },
      {
        tag: ContinueButton,
        props: { next: "InfluenzaVaccination" },
      },
    ],
    key: "GeneralExposure",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      { tag: Divider },
      {
        tag: Questions,
        props: {
          questions: [FluShotConfig, FluShotDateConfig, PreviousSeason],
        },
        validate: true,
      },
      {
        tag: ContinueButton,
        props: { next: "GeneralHealth" },
      },
    ],
    key: "InfluenzaVaccination",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { center: true, label: "desc" } },
      { tag: Divider },
      { tag: ScreenText, props: { label: "next" } },
      {
        tag: Questions,
        props: {
          questions: [
            MedicalConditionConfig,
            HealthCareWorkerConfig,
            SmokeTobaccoConfig,
            HouseholdTobaccoConfig,
            InterferingConfig,
            AntibioticsConfig,
            AntiviralConfig,
            AssignedSexConfig,
            RaceConfig,
            AgeConfig,
          ],
        },
        validate: true,
      },
      {
        tag: ContinueButton,
        props: { next: "ThankYouSurvey" },
      },
    ],
    key: "GeneralHealth",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "questionsthankyou" } },
      {
        tag: SelectableComponent,
        props: {
          components: [
            [
              { tag: Title },
              { tag: ScreenText, props: { label: "desc" } },
              { tag: ScreenText, props: { label: "waiting" } },
            ],
            [
              { tag: Title, props: { label: "titleTimerUp" } },
              { tag: ScreenText, props: { label: "descThanksForAnswering" } },
              undefined,
            ],
          ],
          componentSelectorProp: "tenMinuteTimerDone",
          keyBase: "TimerChangeover",
        },
      },
    ],
    footer: [
      {
        tag: Timer,
        props: {
          next: "TestStripReady",
          startTimeConfig: "tenMinuteStartTime",
          totalTimeMs: TEST_STRIP_MS,
          dispatchOnDone: setTenMinuteTimerDone,
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
        props: { label: "desc" },
      },
      {
        tag: ContinueButton,
        props: {
          dispatchOnNext: setTotalTestStripTime,
          next: "TestStripSurvey",
        },
      },
    ],
    funnelEvent: FunnelEvents.PASSED_SECOND_TIMER,
    key: "TestStripReady",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "lookatteststrip" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: Questions,
        props: {
          questions: [BlueLineConfig],
          logOnSave: logFluResult,
        },
        validate: true,
      },
      {
        tag: ContinueButton,
        props: { surveyGetNextFn: getTestStripSurveyNextScreen },
      },
    ],
    automationNext: "TestResult",
    key: "TestStripSurvey",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "lookatteststrip" } },
      { tag: Title },
      {
        tag: Questions,
        props: {
          questions: [PinkWhenBlueConfig],
          logOnSave: logFluResult,
        },
        validate: true,
      },
      {
        tag: ContinueButton,
        props: { surveyGetNextFn: getPinkWhenBlueNextScreen },
      },
    ],
    automationNext: "TestResult",
    key: "TestStripSurvey2",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "takepictureteststrip" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: BulletPointsComponent,
        props: { label: "instructions" },
      },
      {
        tag: CameraPermissionContinueButton,
        props: {
          grantedNext: CAN_USE_RDT
            ? Platform.OS === "android"
              ? "AndroidRDTReader"
              : "RDTReader"
            : "TestStripCamera",
          deniedNext: "CameraSettings",
        },
      },
    ],
    automationNext: "TestStripConfirmation",
    allowedRemoteConfigValues: ["rdtTimeoutSeconds"],
    key: "RDTInstructions",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "takepictureteststrip" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: BulletPointsComponent,
        props: { label: "instructions" },
      },
      {
        tag: CameraPermissionContinueButton,
        props: {
          grantedNext: "TestStripCamera",
          deniedNext: "CameraSettings",
        },
      },
    ],
    automationNext: "TestStripConfirmation",
    key: "NonRDTInstructions",
  },
  {
    body: [
      {
        tag: RDTReader,
        props: { next: "TestStripConfirmation", fallback: "TestStripCamera" },
      },
    ],
    chromeProps: {
      disableBounce: true,
    },
    backgroundColor: "black",
    key: "RDTReader",
  },
  {
    body: [
      {
        tag: AndroidRDTReader,
        props: { next: "TestStripConfirmation", fallback: "TestStripCamera" },
      },
    ],
    chromeProps: {
      hideChrome: true,
    },
    backgroundColor: "black",
    key: "AndroidRDTReader",
  },
  {
    body: [
      {
        tag: TestStripCamera,
        props: { next: "TestStripConfirmation" },
      },
    ],
    chromeProps: {
      disableBounce: true,
    },
    backgroundColor: "black",
    key: "TestStripCamera",
  },
  {
    body: [
      { tag: RDTImage },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
    ],
    footer: [
      {
        tag: ContinueButton,
        props: {
          next:
            "PackUpTest" /*surveyGetNextFn: getTestStripConfirmationNextScreen*/,
        },
      },
    ],
    key: "TestStripConfirmation",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "updatesettings" } },
      { tag: Title },
      {
        tag: ScreenText,
        props: { label: "desc" },
      },
      {
        tag: BulletPointsComponent,
        props: {
          label: Platform.OS === "android" ? "howToAndroid" : "howToIOS",
        },
      },
    ],
    footer: [
      {
        tag: Button,
        props: {
          enabled: true,
          label: "goToSettings",
          primary: true,
          onPress: openSettingsApp,
        },
      },
    ],
    key: "CameraSettings",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: ContinueButton,
        props: { next: "PrepareUTM" },
      },
    ],
    key: "PackUpTest",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "opennasalswab" } },
      { tag: Title },
      {
        tag: BulletPointsComponent,
        props: { label: "desc" },
      },
      {
        tag: ContinueButton,
        props: { next: "MucusUTM" },
      },
    ],
    key: "PrepareUTM",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "collectmucus" } },
      { tag: Title },
      {
        tag: BulletPointsComponent,
        props: { label: "desc" },
      },
      { tag: VideoPlayer, props: { id: "collectSample" } },
      {
        tag: ContinueButton,
        props: { next: "SwabInTubeUTM" },
      },
    ],
    key: "MucusUTM",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "putswabintube" } },
      { tag: Title },
      {
        tag: BulletPointsComponent,
        props: { label: "desc" },
      },
      {
        tag: ContinueButton,
        props: { next: "PackUpUTM" },
      },
    ],
    funnelEvent: FunnelEvents.SURVIVED_SWAB,
    key: "SwabInTubeUTM",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: ContinueButton,
        props: { next: "PackUpBox" },
      },
    ],
    key: "PackUpUTM",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: ContinueButton,
        props: { next: "Shipping" },
      },
    ],
    key: "PackUpBox",
  },
  {
    body: [{ tag: Title }, { tag: ScreenText, props: { label: "desc" } }],
    key: "Shipping",
    footer: [
      {
        tag: ContinueButton,
        props: {
          label: "pickup",
          next: "SchedulePickup",
          showButtonStyle: true,
        },
      },
      {
        tag: ContinueButton,
        props: { label: "dropoff", next: "TestResult", showButtonStyle: true },
      },
    ],
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: BulletPointsComponent,
        props: { label: "desc2" },
      },
      {
        tag: ScreenText,
        props: { label: "desc3", textVariablesFn: getShippingTextVariables },
      },
      {
        tag: ContinueButton,
        props: { next: "TestResult" },
      },
    ],
    key: "SchedulePickup",
  },
  {
    body: [
      { tag: Title },
      { tag: TestResult },
      { tag: Divider },
      {
        tag: ScreenText,
        props: {
          label: "common:testResult:urgeToContinue",
        },
      },
      {
        tag: ScreenText,
        props: {
          label: "common:testResult:disclaimer",
          style: {
            fontSize: SMALL_TEXT,
          },
        },
      },
      {
        tag: ContinueButton,
        props: { next: "SelfCare" },
      },
    ],
    funnelEvent: FunnelEvents.RECEIVED_TEST_RESULT,
    key: "TestResult",
  },
  {
    body: [
      { tag: Title },
      { tag: TestResultRDT },
      { tag: Divider },
      {
        tag: ScreenText,
        props: {
          label: "common:testResult:urgeToContinue",
        },
      },
      {
        tag: ScreenText,
        props: {
          label: "common:testResult:disclaimer",
          style: {
            fontSize: SMALL_TEXT,
          },
        },
      },
      {
        tag: ContinueButton,
        props: { next: "SelfCare" },
      },
    ],
    funnelEvent: FunnelEvents.RECEIVED_TEST_RESULT,
    key: "TestResultRDT",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: ContinueButton,
        props: { surveyGetNextFn: pendingNavigation },
      },
    ],
    key: "SelfCare",
    automationNext: "Thanks",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "finalthanks" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: LinkInfoBlock,
        props: {
          titleLabel: "treatmentTitle",
          icons: ["drinkfluids", "getrest", "staywarm"],
          linkLabel: "treatmentLinkLabel",
          uri: "https://www.healthdirect.gov.au/colds-and-flu-treatments",
        },
      },
      {
        tag: LinkInfoBlock,
        props: {
          titleLabel: "preventingTitle",
          icons: ["fluvaccine", "keepclean", "washhands"],
          linkLabel: "preventingLinkLabel",
          uri:
            "https://www.healthdirect.gov.au/10-tips-to-fight-the-flu-infographic",
        },
      },
      {
        tag: LinkInfoBlock,
        props: {
          titleLabel: "symptomsTitle",
          icons: ["headache", "runnynose", "fever"],
          linkLabel: "symptomsLinkLabel",
          uri: "https://www.healthdirect.gov.au/colds-and-flu-symptoms",
        },
      },
    ],
    key: "Thanks",
    workflowEvent: "surveyCompletedAt",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "nointernetconnection" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
    ],
    footer: [
      {
        tag: PendingButton,
        props: {
          pendingResolvedFn: uploadPendingSuccess,
          next: "Thanks",
        },
      },
    ],
    key: "PendingData",
  },
];
