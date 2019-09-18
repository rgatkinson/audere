// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import firebase from "react-native-firebase";
import DeviceInfo from "react-native-device-info";
import { recordErrorToFirebase } from "../crashReporter";
import Constants from "expo-constants";

const FIREBASE_LOG_TO_CONSOLE =
  process.env.NODE_ENV === "development" &&
  !!process.env.FIREBASE_LOG_TO_CONSOLE;

let eventGlobals = {
  installation_id: Constants.installationId,
  docid: "uninitialized",
  is_demo: false,
};

const tracker = firebase.analytics();

const demoModeEvent = "app_demo_mode_change";
export const notificationEvent = "push_notification_event";

// You should include { from: <screenname>, to: <screenname> } with these events
export const NavEvents = {
  FORWARD: "nav_forward",
  BACKWARD: "nav_backward",
};

// Include { screen: <screenname> }
export const DrawerEvents = {
  OPEN: "drawer_open",
  CLOSE: "drawer_close",
};

export const FunnelEvents = {
  // Screening events
  CONSENT_COMPLETED: "funnel_consent_completed",
  CONSENT_DECLINED: "funnel_consent_declined",
  // Survey events
  SCAN_CONFIRMATION: "funnel_scan_confirmation",
  MANUAL_CODE_CONFIRMATION: "funnel_manual_code_confirmation",
  SURVIVED_SWAB: "funnel_survived_swab",
  PASSED_FIRST_TIMER: "funnel_passed_first_timer",
  COMPLETED_SURVEY: "funnel_completed_survey",
  PASSED_SECOND_TIMER: "funnel_passed_second_timer",
  BLUE_ANSWER_CHANGED: "funnel_blue_answer_changed",
  PINK_ANSWER_CHANGED: "funnel_pink_answer_changed",
  NUM_LINES_ANSWER_CHANGED: "funnel_num_lines_answer_changed",
  RECEIVED_TEST_RESULT: "funnel_received_test_result",
};

// You should include { video: <uri> } with these events,
// and optionally { currentTime: <time>, totalTime: <time> }
export const VideoEvents = {
  START_VIDEO: "video_view_started",
  VIDEO_PROGRESS: "video_view_progress",
  COMPLETE_VIDEO: "video_view_completed",
};

export const TransportEvents = {
  SURVEY_UPDATED: "survey_updated",
  SURVEY_SYNCED: "survey_synced",
  PHOTO_UPDATED: "photo_updated",
  PHOTO_UPLOADED: "photo_uploaded",
  PHOTO_SYNCED: "photo_synced",
};

export const AppHealthEvents = {
  CAMERA_ERROR: "camera_loading_error",
  LOW_MEMORY_WARNING: "low_memory_warning",
  REDUCED_FRAME_SCALE: "reduced_frame_scale",
  PHOTO_UPLOADER_ERROR: "photo_uploader_error",
  REMOTE_CONFIG_ERROR: "remote_config_error",
  REMOTE_CONFIG_LOADED: "remote_config_loaded",
  REMOTE_CONFIG_OVERRIDDEN: "remote_config_overridden",
  SAVE_STORAGE_PASSWORD_ERROR: "save_storage_password_error",
  FIRESTORE_SAVE_PHOTO_ERROR: "firestore_save_photo_error",
  FIRESTORE_SAVE_SURVEY_ERROR: "firestore_save_survey_error",
  GIFTCARD_API_ERROR: "giftcard_api_error",
};

export const AppEvents = {
  APP_FOREGROUNDED: "app_foregrounded",
  APP_BACKGROUNDED: "app_backgrounded",
  CSRUID_ESTABLISHED: "csruid_established",
  BARCODE_TIMEOUT: "barcode_scanner_timeout",
  RDT_TIMEOUT: "RDT_reader_timeout",
  FLASH_TOGGLE: "camera_flash_toggle",
  SHOWED_RDT_INTERPRETATION: "showed_RDT_interpretation",
  FAQ_PRESSED: "faq_pressed",
  WHAT_TO_DO_WITH_TEST_RESULT_PRESSED: "what_to_do_with_test_result_pressed",
  HELP_TOGGLED: "help_toggled",
  APP_IDLE_NEW_USER: "app_idle_new_user",
  APP_IDLE_SAME_USER: "app_idle_same_user",
  READ_CONFIG_VALUE: "read_config_value",
  LINK_PRESSED: "link_pressed",
  GIFT_CARD_LINK_PRESSED: "gift_card_link_pressed",
  GIFT_CARD_LINK_SHOWN: "gift_card_link_shown",
};

// Payloads of SHOWED_RDT_INTERPRETATION to designate which one was shown.
export enum RDTInterpretationEventTypes {
  None = "None",
  UBICOMP = "Ubicomp",
  IPRD = "IPRD",
  UserHighContrast = "UserHighContrast",
}

export function startTracking() {
  // getUniqueID returns IDFV on iOS (unique ID per install, not per phone),
  // and on Android it'll change per install too after Oreo).  Tracking IDs
  // will allow us not only to correlate events to the same phone, but also to
  // post-hoc filter out demo mode folks (so they don't impact funnel metrics).
  tracker.setUserId(DeviceInfo.getUniqueID());

  // We should ideally pass "isDemo" here instead of false, but we don't want
  // to create a dependency cycle (i.e. tracker should have no internal
  // dependencies).  Passing false is fine here because we start tracking at
  // app launch, when isDemo is false anyway, and we always update
  // the collection status whenever isDemo changes...
  updateCollectionEnabled(false);
}

export function updateCollectionEnabled(isDemo: boolean) {
  eventGlobals = { ...eventGlobals, is_demo: isDemo };

  // We need to filter out, in Firebase, all the users who've ever toggled
  // demo mode ON (at least for that instance of the app installation).  Note
  // that this needs to go _before_ setAnalyticsCollectionEnabled below, because
  // no events/properties/etc are recorded after that moment.
  if (isDemo) {
    tracker.setUserProperty("demo_mode_aware", "true");
  }
  logFirebaseEvent(demoModeEvent);
  tracker.setAnalyticsCollectionEnabled(true);
}

export function onCSRUIDEstablished(csruid: string) {
  eventGlobals = { ...eventGlobals, docid: csruid };
  logFirebaseEvent(AppEvents.CSRUID_ESTABLISHED);
}

export function logCurrentScreen(screen: string) {
  tracker.setCurrentScreen(screen);
}

export function logFirebaseEvent(event: string, params?: object) {
  if (FIREBASE_LOG_TO_CONSOLE) {
    console.log(`LogEvent: '${event}' ${JSON.stringify(params)}`);
  }

  tracker.logEvent(event, {
    ...eventGlobals,
    ...params,
  });
}

export function reportError(error: Error) {
  if (process.env.NODE_ENV === "development") {
    console.error(`ReportError: ${error.message}\n${error.stack}`);
  }
  recordErrorToFirebase(error);
}
