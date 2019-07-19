// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Constants } from "expo";
import { Platform } from "react-native";
import { DeviceInfo } from "audere-lib/common";

export const ios = Constants.platform.ios;

export const DEVICE_INFO: DeviceInfo = {
  installation: Constants.installationId,
  clientVersion: loadBuildInfo(),
  clientBuild: getBuildNumber(),
  yearClass: Constants.deviceYearClass,
  // ios.userInterfaceIdiom will return "handset" or "tablet"
  idiomText: ios ? ios.userInterfaceIdiom : "unknown",
  platform: getPlatformInfo(),
};

function loadBuildInfo() {
  try {
    return require("../../buildInfo.json");
  } catch (e) {
    return `${new Date().toISOString()}.dev-build-without-buildInfo.json`;
  }
}

function getBuildNumber() {
  if (Constants.platform.ios) {
    return +Constants.platform.ios.buildNumber;
  } else if (Constants.platform.android) {
    return Constants.platform.android.versionCode;
  } else {
    return undefined;
  }
}

function getPlatformInfo() {
  if (ios) {
    return Constants.platform;
  } else {
    let androidInfo = Constants.platform;
    if (!!androidInfo.android) {
      androidInfo.android.model = Constants.deviceName;
      androidInfo.android.systemVersion = Platform.Version;
    }
    return androidInfo;
  }
}
