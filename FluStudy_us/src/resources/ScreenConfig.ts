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
  ConsentAnyResearchersConfig,
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
  NumLinesSeenConfig,
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
  TestFeedbackConfig,
  VomitingLast48Config,
  VomitingSeverityConfig,
  VomitingStartConfig,
  WhatSymptomsConfig,
  YoungChildrenConfig,
} from "audere-lib/chillsQuestionConfig";
import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import {
  setConsent,
  setHasBeenOpened,
  setOneMinuteStartTime,
  setTenMinuteStartTime,
  setTenMinuteTimerDone,
  setTotalTestStripTime,
} from "../store";
import BackButton from "../ui/components/BackButton";
import BarcodeScanner from "../ui/components/BarcodeScanner";
import BulletPointsComponent from "../ui/components/BulletPoint";
import Button from "../ui/components/Button";
import CameraPermissionContinueButton from "../ui/components/CameraPermissionContinueButton";
import ConsentText from "../ui/components/ConsentText";
import ContinueButton from "../ui/components/ContinueButton";
import DidYouKnow from "../ui/components/DidYouKnow";
import Divider from "../ui/components/Divider";
import Barcode from "../ui/components/flu/Barcode";
import BarcodeEntry from "../ui/components/flu/BarcodeEntry";
import PatientPIIEntry from "../ui/components/flu/PatientPIIEntry";
import RDTImage from "../ui/components/flu/RDTImage";
import RDTImageHC from "../ui/components/flu/RDTImageHC";
import RDTReader from "../ui/components/flu/RDTReader";
import SurveyLinkBlock from "../ui/components/flu/SurveyLinkBlock";
import TestResult from "../ui/components/flu/TestResult";
import TestResultRDT from "../ui/components/flu/TestResultRDT";
import TestStripCamera from "../ui/components/flu/TestStripCamera";
import FooterNavigation from "../ui/components/FooterNavigation";
import LinkInfoBlock from "../ui/components/LinkInfoBlock";
import Links from "../ui/components/Links";
import MainImage from "../ui/components/MainImage";
import PendingButton from "../ui/components/PendingButton";
import PushNotificationContinueButtonAndroid from "../ui/components/PushNotificationContinueButtonAndroid";
import PushNotificationContinueButtonIOS from "../ui/components/PushNotificationContinueButtonIOS";
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
import { followUpSurvey } from "../util/notifications";
import { openSettingsApp } from "../util/openSettingsApp";
import { uploadPendingSuccess } from "../util/pendingData";
import { getShippingTextVariables } from "../util/shipping";
import { FunnelEvents } from "../util/tracker";

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const TEST_STRIP_MS = 10 * MINUTE_MS;
const CAN_USE_RDT = !DeviceInfo.isEmulator();

export const Screens: ScreenConfig[] = [
  {
    automationNext: "ScanInstructions",
    body: [{ tag: Title }, { tag: ScreenText, props: { label: "desc" } }],
    chromeProps: {
      dispatchOnFirstLoad: [setHasBeenOpened],
      hideBackButton: true,
      splashImage: "welcome",
      fadeIn: true,
    },
    key: "Welcome",
    footer: [
      {
        tag: FooterNavigation,
        props: {
          hideBackButton: true,
          next: "ScanInstructions", // TODO: Make name better
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
    automationNext: "ManualEntry",
    footer: [
      {
        tag: CameraPermissionContinueButton,
        props: { grantedNext: "Scan", deniedNext: "CameraSettings" },
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
      {
        tag: BarcodeEntry,
        validate: true,
        props: { errorScreen: "BarcodeContactSupport" },
      },
      { tag: MainImage, props: { uri: "scanbarcode" } },
      { tag: ScreenText, props: { label: "tips" } },
    ],
    footer: [{ tag: ContinueButton, props: { next: "ManualConfirmation" } }],
    funnelEvent: FunnelEvents.CONSENT_COMPLETED,
    key: "ManualEntry",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "barcodesuccess" } },
      { tag: Title },
      { tag: Barcode },
      { tag: ScreenText, props: { label: "desc" } },
    ],
    footer: [{ tag: ContinueButton, props: { next: "EmailConfirmation" } }],
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
    ],
    footer: [{ tag: ContinueButton, props: { next: "EmailConfirmation" } }],
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
    body: [{ tag: Title }, { tag: ScreenText, props: { label: "desc" } }],
    key: "EmailConfirmation",
    footer: [
      {
        tag: ContinueButton,
        props: {
          label: "common:button:yes",
          next: "HowTestWorks",
        },
      },
      {
        tag: ContinueButton,
        props: {
          label: "common:button:no",
          next: "EmailError",
        },
      },
    ],
  },
  {
    body: [{ tag: Title }, { tag: ScreenText, props: { label: "desc" } }],
    key: "HowTestWorks",
    footer: [
      {
        tag: ContinueButton,
        props: {
          next: "Unpacking",
        },
      },
    ],
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
        },
      },
      {
        tag: ContinueButton,
        props: {
          label: "common:button:no",
          next: "BarcodeContactSupport",
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
        props: { label: "desc", customBulletUri: "listarrow" },
      },
    ],
    footer: [{ tag: ContinueButton, props: { next: "Swab" } }],
    key: "Unpacking",
  },
  {
    body: [
      { tag: Title },
      {
        tag: ScreenText,
        props: {
          center: false,
          label: "desc",

          style: { marginHorizontal: 0 },
        },
      },
      {
        tag: ScreenText,
        props: {
          center: false,
          label: "desc2",
          style: { marginHorizontal: 0 },
        },
      },
      {
        tag: ScreenText,
        props: {
          center: false,
          label: "desc3",
          style: { marginHorizontal: 0 },
        },
      },
    ],
    key: "ParticipantInformation",
    footer: [{ tag: ContinueButton, props: { next: "Consent" } }],
  },
  {
    body: [
      { tag: Title },
      { tag: ConsentText },
      {
        tag: Questions,
        props: { questions: [ConsentAnyResearchersConfig] },
        validate: true,
      },
      {
        tag: ScreenText,
        props: {
          center: false,
          label: "consentFormText2",
          style: {
            marginHorizontal: 0,
          },
        },
      },
    ],
    key: "Consent",
    automationNext: "ManualEntry",
    footer: [
      {
        tag: ContinueButton,
        props: {
          dispatchOnNext: () => setConsent(),
          label: "accept",
          next: "ManualEntry",
        },
      },
      {
        tag: ContinueButton,
        props: {
          label: "noThanks",
          next: "ConsentDeclined",
          primary: false,
          overrideValidate: true,
        },
      },
    ],
  },
  {
    body: [
      { tag: Title },
      { tag: MainImage, props: { uri: "thanksforyourinterest" } },
      { tag: ScreenText, props: { label: "desc" } },
    ],
    footer: [{ tag: BackButton, props: { label: "backToConsent" } }],
    funnelEvent: FunnelEvents.CONSENT_DECLINED,
    key: "ConsentDeclined",
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
    ],
    footer: [{ tag: ContinueButton, props: { next: "InfluenzaVaccination" } }],
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
    ],
    footer: [{ tag: ContinueButton, props: { next: "GeneralHealth" } }],
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
    ],
    footer: [{ tag: ContinueButton, props: { next: "ThankYouSurvey" } }],
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
        props: { label: "desc", customBulletUri: "listarrow" },
      },
    ],
    footer: [
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
    ],
    automationNext: "TestResult",
    footer: [
      {
        tag: ContinueButton,
        props: { surveyGetNextFn: getTestStripSurveyNextScreen },
      },
    ],
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
    ],
    automationNext: "TestResult",
    footer: [
      {
        tag: ContinueButton,
        props: { surveyGetNextFn: getPinkWhenBlueNextScreen },
      },
    ],
    key: "TestStripSurvey2",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "defectiveteststrip" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      { tag: Divider },
      {
        tag: ScreenText,
        props: { label: ["whatToDo", "common:testResult:whatToDoCommon"] },
      },
    ],
    footer: [
      { tag: ContinueButton, props: { next: "PackUpTest" } },
      { tag: Divider },
      {
        tag: ScreenText,
        props: {
          label: "common:testResult:disclaimer",
          style: {
            fontSize: SMALL_TEXT,
          },
        },
      },
    ],
    key: "InvalidResult",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "takepictureteststrip" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: BulletPointsComponent,
        props: {
          label: "instructions",
          customBulletUri: "listarrow",
        },
      },
    ],
    automationNext: "TestStripConfirmation",
    allowedRemoteConfigValues: ["rdtTimeoutSeconds"],
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
      { tag: MainImage, props: { uri: "takepictureteststrip" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: BulletPointsComponent,
        props: { label: "instructions", customBulletUri: "listarrow" },
      },
    ],
    automationNext: "TestStripConfirmation",
    footer: [
      {
        tag: CameraPermissionContinueButton,
        props: {
          grantedNext: "TestStripCamera",
          deniedNext: "CameraSettings",
        },
      },
    ],
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
          customBulletUri: "listarrow",
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
    body: [{ tag: Title }, { tag: ScreenText, props: { label: "desc" } }],
    key: "PackUpTest",
    footer: [{ tag: ContinueButton, props: { next: "PrepareUTM" } }],
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
    footer: [{ tag: ContinueButton, props: { next: "MucusUTM" } }],
    key: "PrepareUTM",
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
    footer: [{ tag: ContinueButton, props: { next: "SwabInTubeUTM" } }],
    key: "MucusUTM",
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
          next: "PackUpUTM",
        },
      },
    ],
    funnelEvent: FunnelEvents.SURVIVED_SWAB,
    key: "SwabInTubeUTM",
  },
  {
    body: [{ tag: Title }, { tag: ScreenText, props: { label: "desc" } }],
    footer: [
      {
        tag: ContinueButton,
        props: {
          next: "PackUpBox",
        },
      },
    ],
    key: "PackUpUTM",
  },
  {
    body: [{ tag: Title }, { tag: ScreenText, props: { label: "desc" } }],
    footer: [
      {
        tag: ContinueButton,
        props: {
          next: "Shipping",
        },
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
        props: { label: "pickup", next: "SchedulePickup" },
      },
      { tag: ContinueButton, props: { label: "dropoff", next: "TestResult" } },
    ],
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: BulletPointsComponent,
        props: { label: "desc2", customBulletUri: "listarrow" },
      },
      {
        tag: ScreenText,
        props: { label: "desc3", textVariablesFn: getShippingTextVariables },
      },
    ],
    key: "SchedulePickup",
    footer: [{ tag: ContinueButton, props: { next: "TestResult" } }],
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { label: "common:testResult:desc" } },
      { tag: TestResult },
    ],
    footer: [
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
        props: {
          next: "SelfCare",
        },
      },
    ],
    funnelEvent: FunnelEvents.RECEIVED_TEST_RESULT,
    key: "TestResult",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { label: "common:testResult:desc" } },
      { tag: TestResultRDT },
    ],
    footer: [
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
      { tag: ContinueButton, props: { next: "SelfCare" } },
    ],
    funnelEvent: FunnelEvents.RECEIVED_TEST_RESULT,
    key: "TestResultRDT",
  },
  {
    body: [{ tag: Title }, { tag: ScreenText, props: { label: "desc" } }],
    key: "SelfCare",
    footer: [{ tag: ContinueButton, props: { next: "TestFeedback" } }],
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
    automationNext: "Thanks",
  },
  {
    body: [
      { tag: MainImage, props: { uri: "finalthanks" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      { tag: SurveyLinkBlock },
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
      { tag: MainImage, props: { uri: "followupsurvey" } },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: BulletPointsComponent,
        props: {
          label:
            Platform.OS === "android"
              ? "androidInstructions"
              : "iosInstructions",
          customBulletUri: "listarrow",
        },
      },
    ],
    footer: [
      {
        tag:
          Platform.OS === "android"
            ? PushNotificationContinueButtonAndroid
            : PushNotificationContinueButtonIOS,
        props: { next: "Thanks", notification: followUpSurvey },
      },
    ],
    key: "FollowUpSurvey",
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
          next: "FollowUpSurvey",
        },
      },
    ],
    key: "PendingData",
  },
];
