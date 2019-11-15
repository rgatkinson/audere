// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  AchesSeverityConfig,
  AffectedRegularActivitiesConfig,
  AntiviralConfig,
  AroundSickChildrenConfig,
  BlueLineConfig,
  ChildrenAgeGroupsConfig,
  ChildrenDaycarePreschoolConfig,
  ChillsSeverityConfig,
  CoughSeverityConfig,
  FatigueSeverityConfig,
  FeverSeverityConfig,
  FluOrColdConfig,
  FluShotConfig,
  FluShotDateConfig,
  HeadacheSeverityConfig,
  HouseholdTobaccoConfig,
  HowLongToSickestConfig,
  HowReceivedFluShotConfig,
  InContactConfig,
  PeopleInHouseholdConfig,
  PinkWhenBlueConfig,
  PublicTransportationConfig,
  RunningNoseSeverityConfig,
  SmokeTobaccoConfig,
  SneezingSeverityConfig,
  SomeoneDiagnosedConfig,
  SoreThroatSeverityConfig,
  SpentTimeCityConfig,
  SpentTimeStateConfig,
  SpentTimeZipCodeConfig,
  SweatsSeverityConfig,
  SymptomsSeverityConfig,
  TravelOutsideStateConfig,
  TravelOutsideUSConfig,
  TroubleBreathingSeverityConfig,
  VomitingSeverityConfig,
  WhatSymptomsConfig,
  WhenFirstNoticedIllnessConfig,
  WhenFirstStartedAntiviralConfig,
  WhichCountriesOutsideUSConfig,
  WorseOrDifferentFromTypicalConfig,
} from "audere-lib/chillsQuestionConfig";
import { Platform } from "react-native";
import {
  setHasBeenOpened,
  setOneMinuteStartTime,
  setOneMinuteTimerDone,
  setTenMinuteStartTime,
  setTenMinuteTimerDone,
  setTotalTestStripTime,
} from "../store";
import BarcodeScanner from "../ui/components/BarcodeScanner";
import BulletPointsComponent from "../ui/components/BulletPoint";
import Button from "../ui/components/Button";
import CameraPermissionContinueButton from "../ui/components/CameraPermissionContinueButton";
import ContinueButton from "../ui/components/ContinueButton";
import DidYouKnow from "../ui/components/DidYouKnow";
import Divider from "../ui/components/Divider";
import EmailEntry from "../ui/components/EmailEntry";
import AndroidRDTReader from "../ui/components/flu/AndroidRDTReader";
import BarcodeEntry from "../ui/components/flu/BarcodeEntry";
import RDTImage from "../ui/components/flu/RDTImage";
import TestStripCamera from "../ui/components/flu/TestStripCamera";
import LinkInfoBlock from "../ui/components/LinkInfoBlock";
import Links from "../ui/components/Links";
import MainImage from "../ui/components/MainImage";
import PendingButton from "../ui/components/PendingButton";
import Questions from "../ui/components/Questions";
import { ScreenConfig } from "../ui/components/Screen";
import ScreenText from "../ui/components/ScreenText";
import SelectableComponent from "../ui/components/SelectableComponent";
import TimerRing from "../ui/components/TimerRing";
import Title from "../ui/components/Title";
import {
  COLLECT_MUCUS_IMAGE_NAME,
  FONT_NORMAL,
  LINK_COLOR,
  SMALL_TEXT,
} from "../ui/styles";
import {
  getPinkWhenBlueNextScreen,
  getTestStripSurveyNextScreen,
  logFluResult,
} from "../util/fluResults";
import { getGeneralExposureTextVariables } from "../util/generalExposure";
import { openSettingsApp } from "../util/openSettingsApp";
import {
  getBarcodeNextScreen,
  getEmailConfirmationNextScreen,
  getEmailConfirmationTextVariables,
  getShippingTextVariables,
} from "../util/patientAchievementInfo";
import { pendingNavigation, uploadPendingSuccess } from "../util/pendingData";
import { resetAlert } from "../util/resetAlert";
import { getRdtResult } from "../util/results";
import { getSymptomsNextScreen } from "../util/symptomsResults";

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const TEST_STRIP_MS = 10 * MINUTE_MS;

export const Screens: ScreenConfig[] = [
  {
    backgroundColor: "transparent",
    body: [
      { tag: MainImage, props: { uri: "welcome", useForChrome: true } },
      { tag: Title, props: { center: false, color: "white" } },
      { tag: ScreenText, props: { label: "desc", style: { color: "white" } } },
      {
        tag: ContinueButton,
        props: {
          next: "HowDoesTestWork",
          textStyle: { color: "white" },
        },
      },
      {
        tag: ScreenText,
        props: {
          label: "desc2",
          style: { color: "white", fontSize: SMALL_TEXT },
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
    body: [
      { tag: Title },
      {
        tag: ScreenText,
        props: {
          label: "desc",
          linkStyle: { color: LINK_COLOR, fontFamily: FONT_NORMAL },
        },
      },
    ],
    key: "NotEnrolledInStudy",
  },
  {
    backgroundColor: "transparent",
    body: [
      { tag: MainImage, props: { uri: "howtestworks", useForChrome: true } },
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
      { tag: MainImage, props: { uri: "howthishelps", useForChrome: true } },
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
          next: "ResearchStudy",
          textStyle: { color: "white" },
        },
      },
    ],
    chromeProps: { showBackgroundOnly: true },
    automationNext: "ResearchStudy",
    key: "HowAmIHelping",
  },
  {
    backgroundColor: "transparent",
    body: [
      { tag: MainImage, props: { uri: "howthishelps", useForChrome: true } },
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
          surveyGetNextFn: getBarcodeNextScreen,
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
        props: { surveyGetNextFn: getBarcodeNextScreen },
      },
    ],
    key: "ManualEntry",
    keyboardAvoidingView: true,
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
      {
        tag: ContinueButton,

        props: {
          label: "common:button:tryAgain",
          style: { alignSelf: "center" },
          surveyGetNextFn: getBarcodeNextScreen,
        },
      },
    ],
    key: "BarcodeConnectionToServerError",
  },
  {
    body: [
      { tag: Title },
      {
        tag: ScreenText,
        props: {
          label: "desc",
          textVariablesFn: getEmailConfirmationTextVariables,
        },
      },
      {
        tag: EmailEntry,
        props: {
          placeholder: "common:emailEntry:placeholder",
        },
        validate: true,
      },
      {
        tag: ContinueButton,
        props: { surveyGetNextFn: getEmailConfirmationNextScreen },
      },
    ],
    chromeProps: {
      onBack: resetAlert,
    },
    key: "EmailConfirmation",
    keyboardAvoidingView: true,
  },
  {
    body: [
      { tag: Title },
      {
        tag: ScreenText,
        props: {
          label: "desc",
          textVariablesFn: getEmailConfirmationTextVariables,
        },
      },
    ],
    key: "EmailError",
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
    workflowEvent: "surveyStartedAt",
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
      {
        tag: MainImage,
        props: { uri: COLLECT_MUCUS_IMAGE_NAME },
      },
      { tag: Title },
      {
        tag: BulletPointsComponent,
        props: { label: "desc" },
      },
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
    ],
    footer: [
      {
        tag: ContinueButton,
        props: {
          dispatchOnNext: () => setOneMinuteStartTime(),
          label: "startTimer",
          next: "FirstTimer",
          showButtonStyle: true,
        },
      },
    ],
    key: "SwabInTube",
  },
  {
    body: [
      {
        tag: TimerRing,
        props: {
          startTimeConfig: "oneMinuteStartTime",
          totalTimeMs: MINUTE_MS,
          dispatchOnDone: setOneMinuteTimerDone,
        },
      },
      { tag: Title },
      {
        tag: DidYouKnow,
        props: {
          startTimeConfig: "oneMinuteStartTime",
          msPerItem: 10 * SECOND_MS,
        },
      },
      {
        tag: SelectableComponent,
        props: {
          components: [
            null,
            { tag: ContinueButton, props: { next: "RemoveSwabFromTube" } },
          ],
          componentSelectorProp: "oneMinuteTimerDone",
          keyBase: "FirstTimer",
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
      {
        tag: ContinueButton,
        props: { next: "OpenTestStrip" },
      },
    ],
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
        },
      },
    ],
    key: "StripInTube",
  },
  {
    body: [
      { tag: Title },
      { tag: Divider },
      {
        tag: Questions,
        props: { questions: [WhatSymptomsConfig] },
        validate: true,
      },
      {
        tag: ContinueButton,
        props: { surveyGetNextFn: getSymptomsNextScreen },
      },
    ],
    key: "WhatSymptoms",
  },
  {
    body: [
      { tag: Title },
      { tag: Divider },
      {
        tag: Questions,
        props: {
          questions: [
            SymptomsSeverityConfig,
            FeverSeverityConfig,
            HeadacheSeverityConfig,
            CoughSeverityConfig,
            ChillsSeverityConfig,
            SweatsSeverityConfig,
            SoreThroatSeverityConfig,
            VomitingSeverityConfig,
            RunningNoseSeverityConfig,
            SneezingSeverityConfig,
            FatigueSeverityConfig,
            AchesSeverityConfig,
            TroubleBreathingSeverityConfig,
          ],
        },
        validate: true,
      },
      {
        tag: ContinueButton,
        props: { next: "IllnessBeginnings" },
      },
    ],
    key: "SymptomsInfo",
  },
  {
    body: [
      { tag: Title },
      {
        tag: Questions,
        props: {
          questions: [
            WhenFirstNoticedIllnessConfig,
            HowLongToSickestConfig,
            FluOrColdConfig,
            WorseOrDifferentFromTypicalConfig,
          ],
        },
        validate: true,
      },
      {
        tag: ContinueButton,
        props: { next: "AntiviralMedication" },
      },
    ],
    key: "IllnessBeginnings",
  },
  {
    body: [
      { tag: Title },
      {
        tag: Questions,
        props: {
          questions: [AntiviralConfig, WhenFirstStartedAntiviralConfig],
        },
        validate: true,
      },
      {
        tag: ContinueButton,
        props: { next: "InfluenzaVaccination" },
      },
    ],
    key: "AntiviralMedication",
  },
  {
    body: [
      { tag: Title },
      {
        tag: Questions,
        props: {
          questions: [
            FluShotConfig,
            FluShotDateConfig,
            HowReceivedFluShotConfig,
          ],
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
      {
        tag: Questions,
        props: {
          questions: [
            AffectedRegularActivitiesConfig,
            SmokeTobaccoConfig,
            HouseholdTobaccoConfig,
          ],
        },
        validate: true,
      },
      {
        tag: ContinueButton,
        props: { next: "GeneralExposure" },
      },
    ],
    key: "GeneralHealth",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: Questions,
        props: {
          questions: [
            TravelOutsideStateConfig,
            TravelOutsideUSConfig,
            SpentTimeCityConfig,
            SpentTimeStateConfig,
            SpentTimeZipCodeConfig,
            WhichCountriesOutsideUSConfig,
            PeopleInHouseholdConfig,
            ChildrenAgeGroupsConfig,
            ChildrenDaycarePreschoolConfig,
            SomeoneDiagnosedConfig,
            InContactConfig,
            PublicTransportationConfig,
            AroundSickChildrenConfig,
          ],
          textVariablesFn: getGeneralExposureTextVariables,
        },
        validate: true,
      },
      {
        tag: ContinueButton,
        props: { next: "ThankYouSurvey" },
      },
    ],
    key: "GeneralExposure",
    keyboardAvoidingView: true,
  },
  {
    body: [
      {
        tag: TimerRing,
        props: {
          startTimeConfig: "tenMinuteStartTime",
          totalTimeMs: TEST_STRIP_MS,
          dispatchOnDone: setTenMinuteTimerDone,
        },
      },
      {
        tag: SelectableComponent,
        props: {
          components: [
            [
              { tag: Title, props: { center: false } },
              { tag: ScreenText, props: { label: "desc" } },
              null,
            ],
            [
              { tag: Title, props: { center: false, label: "titleTimerUp" } },
              { tag: ScreenText, props: { label: "descTimerUp" } },
              { tag: ContinueButton, props: { next: "TestStripReady" } },
            ],
          ],
          componentSelectorProp: "tenMinuteTimerDone",
          keyBase: "TimerChangeover",
        },
      },
    ],
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
    automationNext: "PackUpTest",
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
    automationNext: "PackUpTest",
    key: "TestStripSurvey2",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      { tag: Divider },
      {
        tag: BulletPointsComponent,
        props: {
          num: 1,
          label: "instructions",
          textStyle: { fontWeight: "bold" },
        },
      },
      {
        tag: MainImage,
        props: { uri: "scanthestrip", imageStyle: { marginTop: 0 } },
      },
      { tag: Divider },
      {
        tag: BulletPointsComponent,
        props: {
          num: 2,
          label: "instructions2",
          textStyle: { fontWeight: "bold" },
        },
      },
      {
        tag: MainImage,
        props: { uri: "holdphone", imageStyle: { marginTop: 0 } },
      },
      { tag: Divider },
      { tag: ScreenText, props: { label: "desc2" } },
      {
        tag: CameraPermissionContinueButton,
        props: {
          grantedNext: "AndroidRDTReader",
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
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      { tag: Divider },
      {
        tag: BulletPointsComponent,
        props: {
          num: 1,
          label: "instructions",
          textStyle: { fontWeight: "bold" },
        },
      },
      {
        tag: MainImage,
        props: { uri: "scanthestrip", imageStyle: { marginTop: 0 } },
      },
      { tag: Divider },
      {
        tag: BulletPointsComponent,
        props: {
          num: 2,
          label: "instructions2",
          textStyle: { fontWeight: "bold" },
        },
      },
      {
        tag: MainImage,
        props: { uri: "holdphone", imageStyle: { marginTop: 0 } },
      },
      { tag: Divider },
      {
        tag: BulletPointsComponent,
        props: {
          num: 3,
          label: "instructions3",
          textStyle: { fontWeight: "bold" },
        },
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
      hideChrome: true,
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
      {
        tag: ScreenText,
        props: {
          demoOnly: true,
          label: "diagnosis",
          textVariablesFn: getRdtResult,
        },
      },
      {
        tag: ContinueButton,
        props: { next: "PackUpTest" },
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
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: BulletPointsComponent,
        props: { label: "desc2" },
      },
      {
        tag: ContinueButton,
        props: { next: "OpenSwabUTM" },
      },
    ],
    key: "PrepareUTM",
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
    key: "OpenSwabUTM",
  },
  {
    body: [
      {
        tag: MainImage,
        props: { uri: COLLECT_MUCUS_IMAGE_NAME },
      },
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: BulletPointsComponent,
        props: { label: "desc2" },
      },
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
    key: "SwabInTubeUTM",
  },
  {
    body: [
      { tag: Title },
      {
        tag: BulletPointsComponent,
        props: { label: "desc" },
      },
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
      {
        tag: BulletPointsComponent,
        props: { label: "desc" },
      },
      {
        tag: ContinueButton,
        props: { next: "Shipping" },
      },
    ],
    key: "PackUpBox",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: BulletPointsComponent,
        props: { label: "desc2", textVariablesFn: getShippingTextVariables },
      },
      { tag: ScreenText, props: { label: "desc3" } },
      {
        tag: ContinueButton,
        props: { surveyGetNextFn: pendingNavigation },
      },
    ],
    key: "Shipping",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: BulletPointsComponent,
        props: { label: "desc2" },
      },
      { tag: ScreenText, props: { label: "desc3" } },
      {
        tag: BulletPointsComponent,
        props: { label: "desc4" },
      },
      {
        tag: ContinueButton,
        props: { surveyGetNextFn: pendingNavigation },
      },
    ],
    key: "CallForPickup",
  },
  {
    body: [
      { tag: Title },
      { tag: ScreenText, props: { label: "desc" } },
      {
        tag: BulletPointsComponent,
        props: { label: "desc2" },
      },
      { tag: ScreenText, props: { label: "desc3" } },
      {
        tag: ContinueButton,
        props: { surveyGetNextFn: pendingNavigation },
      },
    ],
    key: "WebSiteForPickup",
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
