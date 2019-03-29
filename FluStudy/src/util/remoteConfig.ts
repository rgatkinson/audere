// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import firebase from "react-native-firebase";
import { crashlytics } from "../crashReporter";
import { tracker, AppHealthEvents } from "../util/tracker";

interface RemoteConfig {
  blockKitOrders: boolean;
  showVideos: boolean;
}

// Every config you load should have a default set here.  Remember that the
// default needs to make sense for people offline (that is, you should "fail
// safe").
//
// Note: we use Object.assign() to clone this into _currentConfig.  If you add
// properties that aren't shallow, we need to update that code to do a deep
// clone.
const DEFAULT_CONFIGS: RemoteConfig = {
  blockKitOrders: true, // Pessimistically assume we have no kits
  showVideos: true,
};

// Values you put into here will always be applied on top of remote config
// values (merged over) in non-production environments.
const DEV_CONFIG_OVERRIDES = {
  blockKitOrders: false,
  showVideos: true,
};

let _currentConfig: RemoteConfig = Object.assign({}, DEFAULT_CONFIGS);

async function loadConfig() {
  const config = firebase.config();
  const remoteConfigSnapshots = await config.getValues(
    Object.getOwnPropertyNames(DEFAULT_CONFIGS)
  );

  Object.keys(remoteConfigSnapshots).map(key => {
    // @ts-ignore
    _currentConfig[key] = remoteConfigSnapshots[key].val();
  });
  tracker.logEvent(AppHealthEvents.REMOTE_CONFIG_LOADED, _currentConfig);
  crashlytics.log(`Remote config loaded: ${JSON.stringify(_currentConfig)}`);

  if (process.env.NODE_ENV === "development") {
    _currentConfig = { ..._currentConfig, ...DEV_CONFIG_OVERRIDES };

    tracker.logEvent(AppHealthEvents.REMOTE_CONFIG_OVERRIDDEN, _currentConfig);
    crashlytics.log(
      `Remote config overridden: ${JSON.stringify(_currentConfig)}`
    );
  }
}

// As long as you've awaited loadAllRemoteConfigs, you can call getRemoteConfig
// to load any key from configuration.
export function getRemoteConfig(key: string): any {
  // @ts-ignore
  return _currentConfig[key];
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

    const activated = await config.activateFetched();
    if (activated) {
      await loadConfig();
    }
  } catch (error) {
    const errorMessage = `Remote Config Load Error: ${
      error && error.message ? error.message : error
    }`;

    tracker.logEvent(AppHealthEvents.REMOTE_CONFIG_ERROR, {
      errorMessage,
    });
    crashlytics.log(errorMessage);
  }
}
