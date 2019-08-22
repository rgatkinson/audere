// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

const os = require("os");
const path = require("path");

const PLATFORM = "iOS";
const config = {
  platformName: "iOS",
  platformVersion: "12.2",
  deviceName: "iPhone 8",
  app: path.join(
    os.homedir(),
    "Library/Developer/Xcode/DerivedData/fluathome_us/Build/Products/Debug-iphonesimulator/fluathome.app"
  ),
};
const SCREEN_X = 375;
const SCREEN_Y = 665;
module.exports = { PLATFORM, config, SCREEN_X, SCREEN_Y };
