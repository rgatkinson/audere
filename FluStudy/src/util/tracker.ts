// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import firebase from "react-native-firebase";
import DeviceInfo from "react-native-device-info";
import url from "url";

export const tracker = firebase.analytics();

const demoModeEvent = "app_demo_mode_change";

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
  DECLINED_CONSENT: "funnel_declined_consent",
  ADDRESS_COMPLETED: "funnel_address_completed",
  AGE_INELIGIBLE: "funnel_age_ineligible",
  SYMPTOMS_INELIGIBLE: "funnel_symptoms_ineligible",
  STATE_INELIGIBLE: "funnel_state_ineligible",

  // Survey events
  RECEIVED_KIT: "funnel_received_kit",
  EMAIL_COMPLETED: "funnel_email_completed",
  SCAN_CONFIRMATION: "funnel_scan_confirmation",
  MANUAL_CODE_CONFIRMATION: "funnel_manual_code_confirmation",
  SURVIVED_FIRST_SWAB: "funnel_survived_first_swab",
  PASSED_FIRST_TIMER: "funnel_passed_first_timer",
  COMPLETED_SURVEY: "funnel_completed_survey",
  COMPLETED_FIRST_TEST: "funnel_completed_first_test",
  COMPLETED_SECOND_TEST: "funnel_completed_second_test",
  COMPLETED_SHIPPING: "funnel_completed_shipping",
};

export const AppHealthEvents = {
  REMOTE_CONFIG_ERROR: "remote_config_error",
  REMOTE_CONFIG_LOADED: "remote_config_loaded",
  REMOTE_CONFIG_OVERRIDDEN: "remote_config_overridden",
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
async function shouldTrack(isDemo: boolean): Promise<boolean> {
  if (forceMeToBeTracked) {
    console.log("[Tracker] Overriding exclusions and sending tracking info!");
    return true;
  }

  const isProduction =
    process.env.REACT_NATIVE_API_SERVER === "https://api.auderenow.io/api";

  return !isDemo && isProduction;
}

// These User Properties have been created on our Firebase console as a way to
// segment users
const marketingUserProperties = [
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
];

async function recordMarketingAttributions() {
  const link = await firebase.links().getInitialLink();
  if (!link) {
    return;
  }

  const parsed = url.parse(link, true);
  if (!parsed || !parsed.query) {
    return;
  }

  const filteredProperties = {};
  marketingUserProperties.forEach(property => {
    if (parsed.query[property]) {
      // @ts-ignore
      filteredProperties[property] = parsed.query[property];
    }
  });
  if (Object.keys(filteredProperties).length > 0) {
    tracker.setUserProperties(filteredProperties);
  }
}

export async function startTracking(): Promise<[void, void]> {
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
  return Promise.all([
    recordMarketingAttributions(),
    updateCollectionEnabled(false),
  ]);
}

export async function updateCollectionEnabled(isDemo: boolean): Promise<void> {
  const should = await shouldTrack(isDemo);

  tracker.logEvent(demoModeEvent, { isDemo });
  tracker.setAnalyticsCollectionEnabled(should);
}
