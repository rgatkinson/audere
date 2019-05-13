// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

const os = require("os");
const path = require("path");

const PLATFORM = "Android";
const config = {
  platformName: "Android",
  platformVersion: "9",
  deviceName: "Android Emulator",
  app: path.join(
    os.homedir(),
    "audere/FluStudy_au/android/app/build/outputs/apk/devKernel/debug/app-devKernel-x86-debug.apk"
  ),
  automationName: "UiAutomator2",
};
const SCREEN_X = 1435;
const SCREEN_Y = 2375;
module.exports = { PLATFORM, config, SCREEN_X, SCREEN_Y };
