// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

const os = require("os");
const path = require("path");

device_list = {
  "iPhone 7 Plus": { X: 415, Y: 735 },
  "iPhone 8": { X: 375, Y: 665 },
  "iPhone Xs Max": { X: 415, Y: 890 },
  "iPad Pro (12.9-inch) (2nd generation)": { X: 370, Y: 495 },
  "iPad Pro (12.9-inch) (3rd generation)": { X: 1025, Y: 1360 },
};

const device = process.env.TEST_UI_DEVICE
  ? process.env.TEST_UI_DEVICE
  : "iPhone 8";

if (!(device in device_list)) {
  throw `${device} is not an accepted device`;
}

const PLATFORM = "iOS";
const config = {
  platformName: "iOS",
  platformVersion: "12.4",
  deviceName: device,
  app: path.join(
    os.homedir(),
    "Library/Developer/Xcode/DerivedData/fluathome_au/Build/Products/Debug-iphonesimulator/fluathome.app"
  ),
};

const SCREEN_X = device_list[device].X;
const SCREEN_Y = device_list[device].Y;
const SIMULATOR = true;

module.exports = { PLATFORM, config, SCREEN_X, SCREEN_Y, SIMULATOR };
