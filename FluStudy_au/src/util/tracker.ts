// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import firebase from "react-native-firebase";
import DeviceInfo from "react-native-device-info";
import url from "url";
import { DangerZone } from "expo";
import { recordErrorToFirebase } from "../crashReporter";

export const tracker = firebase.analytics();
let { Branch } = DangerZone;

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
  MET_SYMPTOMS: "funnel_met_symptoms",
  CONSENT_INELIGIBLE: "funnel_consent_ineligible",
  CONSENT_COMPLETED: "funnel_consent_completed",
  ADDRESS_ATTEMPTED: "funnel_address_attempted",
  ADDRESS_STATE_INVALID: "funnel_address_state_invalid",
  ADDRESS_PO_BOX_EXCLUDED: "funnel_address_po_box_excluded",
  ADDRESS_VERIFICATION_RESULTS_OBTAINED:
    "funnel_address_verification_results_obtained",
  ADDRESS_VERIFICATION_SKIPPED_DEMO: "funnel_address_verification_skipped_demo",
  ADDRESS_VERIFICATION_SKIPPED_NO_INTERNET:
    "funnel_address_verification_skipped_no_internet",
  ADDRESS_CORRECTION_CHOSEN: "funnel_address_correction_chosen",
  ADDRESS_SUGGESTION_IGNORED: "funnel_address_suggestion_ignored",
  ADDRESS_COMPLETED: "funnel_address_completed",
  AGE_INELIGIBLE: "funnel_age_ineligible",
  SYMPTOMS_INELIGIBLE: "funnel_symptoms_ineligible",
  STATE_INELIGIBLE: "funnel_state_ineligible",
  ADDRESS_INELIGIBLE: "funnel_address_ineligible",
  PO_BOX_INELIGIBLE: "po_box_ineligible",

  // Survey events
  RECEIVED_KIT: "funnel_received_kit",
  SCAN_CONFIRMATION: "funnel_scan_confirmation",
  MANUAL_CODE_CONFIRMATION: "funnel_manual_code_confirmation",
  SURVIVED_FIRST_SWAB: "funnel_survived_first_swab",
  PASSED_FIRST_TIMER: "funnel_passed_first_timer",
  COMPLETED_SURVEY: "funnel_completed_survey",
  RESULT_NO_BLUE: "funnel_result_no_blue",
  RESULT_BLUE: "funnel_result_blue",
  RESULT_BLUE_NO_RED: "funnel_result_blue_no_red",
  RESULT_BLUE_ANY_RED: "funnel_result_blue_any_red",
  COMPLETED_FIRST_TEST: "funnel_completed_first_test",
  COMPLETED_SECOND_TEST: "funnel_completed_second_test",
  COMPLETED_SHIPPING: "funnel_completed_shipping",
};

// You should include { video: <uri> } with these events,
// and optionally { currentTime: <time>, totalTime: <time> }
export const VideoEvents = {
  START_VIDEO: "video_view_started",
  VIDEO_PROGRESS: "video_view_progress",
  COMPLETE_VIDEO: "video_view_completed",
};

export const BarcodeVerificationEvents = {
  SERVER_RESPONSE: "barcode_verification_server_response",
  EXCEPTION: "barcode_verification_exception",
  VALID_SUPPORT_CODE: "valid_support_code",
  INVALID_SUPPORT_CODE: "invalid_support_code",
};

export const AppHealthEvents = {
  BRANCH_DATA_ERROR: "branch_data_error",
  BRANCH_GOT_ATTRIBUTION: "branch_got_attribution",
  BRANCH_NO_ATTRIBUTION: "branch_no_attribution",
  BRANCH_NOT_FIRST_SESSION: "branch_not_first_session",
  FIREBASE_GOT_ATTRIBUTION: "firebase_got_attribution",
  FIREBASE_NO_ATTRIBUTION: "firebase_no_attribution",
  KIT_ORDER_BLOCKED: "kit_order_blocked",
  KIT_ORDER_UNBLOCKED: "kit_order_unblocked",
  PHOTO_UPLOADER_ERROR: "photo_uploader_error",
  REMOTE_CONFIG_ERROR: "remote_config_error",
  REMOTE_CONFIG_LOADED: "remote_config_loaded",
  REMOTE_CONFIG_OVERRIDDEN: "remote_config_overridden",
  SAVE_STORAGE_PASSWORD_ERROR: "save_storage_password_error",
  SMARTY_STREETS_ERROR: "smarty_streets_error",
  FIRESTORE_SAVE_SURVEY_ERROR: "firestore_save_survey_error",
};

export const AppEvents = {
  APP_FOREGROUNDED: "app_foregrounded",
  APP_BACKGROUNDED: "app_backgrounded",
  CSRUID_ESTABLISHED: "csruid_established",
};

// By default, we don't log demo mode and non-production builds.  If you're
// debugging logging, set this to true on your own machine to bypass all those
// logging exclusions. Please don't commit true to our codebase unless you're
// absolutely positive.
const forceMeToBeTracked = false; // DO NOT COMMIT `true`!

// NOTE: We have a build flag (-FIRDebugEnabled) in Xcode that causes firebase
// events to be sent to firebase's web-based debug page.  shouldTrack
// acts BEFORE that's taken into account:  meaning you first decide whether
// any tracking data should be sent at all, and then the build flag decides
// whether that data goes into firebase's debug stream vs. prod stream.
//
// So: to see your debug data online in firebase's debug stream, set
// forceMeToBeTracked = true AND make sure you're running a debug build
// (which by default contains -FIRDebugEnabled).
function shouldTrack(): boolean {
  if (forceMeToBeTracked) {
    console.log("[Tracker] Overriding exclusions and sending tracking info!");
    return true;
  }

  const isProduction =
    process.env.REACT_NATIVE_API_SERVER === "https://api.auderenow.io/api";

  return isProduction;
}

// These User Properties have been created on our Firebase console as a way to
// segment users
const marketingUserProperties = [
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
];

const parsedMarketingProperties = {};

type BranchData = {
  error: string | null;
  uri?: string | null;
  params: Object | null;
};

// Called by Branch.io's RN integration when it successfully loads deep link
// information.
function onBranchData(data: BranchData) {
  const { error, params } = data;

  if (error) {
    tracker.logEvent(AppHealthEvents.BRANCH_DATA_ERROR, { error });
    return;
  }

  if (params) {
    // @ts-ignore
    if (params["+is_first_session"]) {
      storeMarketingAttributes(params, false);
    } else {
      tracker.logEvent(AppHealthEvents.BRANCH_NOT_FIRST_SESSION, {
        params: JSON.stringify(params),
      });
    }
  } else {
    tracker.logEvent(AppHealthEvents.BRANCH_DATA_ERROR, { error: "no params" });
  }
}

function storeMarketingAttributes(params: Object, fromFirebase: boolean) {
  marketingUserProperties.forEach(property => {
    if (params.hasOwnProperty(property)) {
      // @ts-ignore
      parsedMarketingProperties[property] = params[property];
    }
  });

  // @ts-ignore
  if (params["ref"]) {
    // @ts-ignore
    parsedMarketingProperties["install_referrer"] = params["ref"];
  }

  if (Object.keys(parsedMarketingProperties).length > 0) {
    tracker.setUserProperties(parsedMarketingProperties);
    tracker.logEvent(
      fromFirebase
        ? AppHealthEvents.FIREBASE_GOT_ATTRIBUTION
        : AppHealthEvents.BRANCH_GOT_ATTRIBUTION,
      parsedMarketingProperties
    );
  } else {
    tracker.logEvent(
      fromFirebase
        ? AppHealthEvents.FIREBASE_NO_ATTRIBUTION
        : AppHealthEvents.BRANCH_NO_ATTRIBUTION
    );
  }
}

async function recordMarketingAttributions() {
  const link = await firebase.links().getInitialLink();
  if (!link) {
    return;
  }

  const parsed = url.parse(link, true);
  if (!parsed || !parsed.query) {
    return;
  }

  storeMarketingAttributes(parsed.query, true);
}

// We export this, instead of directly writing these properties into our store,
// so that this tracking module doesn't end up generating a dependency cycle.
export function getMarketingProperties() {
  return parsedMarketingProperties;
}

export async function startTracking(): Promise<void> {
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

  Branch.subscribe(onBranchData);
  await recordMarketingAttributions();
}

export function updateCollectionEnabled(isDemo: boolean) {
  const should = shouldTrack();

  // We need to filter out, in Firebase, all the users who've ever toggled
  // demo mode ON (at least for that instance of the app installation).  Note
  // that this needs to go _before_ setAnalyticsCollectionEnabled below, because
  // no events/properties/etc are recorded after that moment.
  if (isDemo) {
    tracker.setUserProperty("demo_mode_aware", "true");
  }
  tracker.logEvent(demoModeEvent, { isDemo });
  tracker.setAnalyticsCollectionEnabled(should);
}

export function onCSRUIDEstablished(csruid: string) {
  tracker.logEvent(AppEvents.CSRUID_ESTABLISHED, { csruid });
}

export function logDebugEvent(event: string, params?: Object) {
  if (process.env.NODE_ENV === "development") {
    console.log(`LogEvent: ${event}`, params);
  }
  tracker.logEvent(event, params);
}

export function reportError(error: Error) {
  if (process.env.NODE_ENV === "development") {
    console.error(`ReportError: ${error.message}\n${error.stack}`);
  }
  recordErrorToFirebase(error);
}
