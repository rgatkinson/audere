// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import firebase from "react-native-firebase";
import { crashlytics } from "../crashReporter";
import { logFirebaseEvent, AppEvents, AppHealthEvents } from "../util/tracker";

interface RemoteConfig {
  advanceRDTCaptureOnMemoryWarning: boolean;
  showRDTInterpretation: string;
  rdtTimeoutSeconds: number;
  skipSurveyNotification: boolean;
  [key: string]: boolean | number | string[] | string;
}

// Every config you load should have a default set here.  Remember that the
// default needs to make sense for people offline (that is, you should "fail
// safe").
//
// Note: we use Object.assign() to clone this into _currentConfig.  If you add
// properties that aren't shallow, we need to update that code to do a deep
// clone.
const DEFAULT_CONFIGS: RemoteConfig = {
  advanceRDTCaptureOnMemoryWarning: false,
  showRDTInterpretation: "",
  rdtTimeoutSeconds: 30,
  skipSurveyNotification: false,
};

// Values you put into here will always be applied on top of remote config
// values (merged over) in non-production environments.
const DEV_CONFIG_OVERRIDES = {};

let _currentConfig: RemoteConfig = Object.assign({}, DEFAULT_CONFIGS);

async function loadConfig(): Promise<RemoteConfig> {
  const config = firebase.config();
  const remoteConfigSnapshots = await config.getValues(
    Object.getOwnPropertyNames(DEFAULT_CONFIGS)
  );

  let localConfig: RemoteConfig = Object.assign({}, DEFAULT_CONFIGS);
  Object.keys(remoteConfigSnapshots).map(key => {
    localConfig[key] = remoteConfigSnapshots[key].val();
  });
  logFirebaseEvent(AppHealthEvents.REMOTE_CONFIG_LOADED, localConfig);
  crashlytics.log(`Remote config loaded: ${JSON.stringify(localConfig)}`);

  if (process.env.NODE_ENV === "development") {
    localConfig = { ...localConfig, ...DEV_CONFIG_OVERRIDES };

    logFirebaseEvent(AppHealthEvents.REMOTE_CONFIG_OVERRIDDEN, localConfig);
    crashlytics.log(`Remote config overridden: ${JSON.stringify(localConfig)}`);
  }
  return localConfig;
}

// As long as you've awaited loadAllRemoteConfigs, you can call getRemoteConfig
// to load any key from configuration.
export function getRemoteConfig(key: string): any {
  const value = _currentConfig[key];
  logFirebaseEvent(AppEvents.READ_CONFIG_VALUE, { key, value });
  return value;
}

const SECONDS_IN_HOUR = 60 * 60;

export async function loadAllRemoteConfigs() {
  const config = firebase.config();

  if (process.env.NODE_ENV === "development") {
    // This removes all caching and basically fetches the config each time
    config.enableDeveloperMode();
  }

  config.setDefaults(DEFAULT_CONFIGS);

  try {
    // We tried fetch(0), which means "always pull from network", but the
    // problem is that you get throttled by Remote Config if you hit the
    // servers too often.  Interwebs lore is that the limit is 5 times in
    // any given hour, throttled from the client side.  To be safe, we cache
    // for an hour now.
    await config.fetch(SECONDS_IN_HOUR);
    await config.activateFetched();

    _currentConfig = await loadConfig();
  } catch (error) {
    const errorMessage = `Remote Config Load Error: ${
      error && error.message ? error.message : error
    }`;

    logFirebaseEvent(AppHealthEvents.REMOTE_CONFIG_ERROR, {
      errorMessage,
    });
    crashlytics.log(errorMessage);
  }
}
