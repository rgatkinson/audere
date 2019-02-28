// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Constants } from "expo";

const ios = Constants.platform.ios;

export const DEVICE_INFO = {
  installation: Constants.installationId,
  clientVersion: loadBuildInfo(),
  yearClass: Constants.deviceYearClass,
  // ios.userInterfaceIdiom will return "handset" or "tablet"
  idiomText: ios ? ios.userInterfaceIdiom : "unknown",
  platform: JSON.stringify(Constants.platform),
};

export type DeviceInfo = typeof DEVICE_INFO;

function loadBuildInfo() {
  try {
    return require("../../buildInfo.json");
  } catch (e) {
    return `${new Date().toISOString()}.dev-build-without-buildInfo.json`;
  }
}
