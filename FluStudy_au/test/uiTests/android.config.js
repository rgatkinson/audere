// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

const os = require("os");
const path = require("path");

device_list = {
  "Android Emulator": { X: 1435, Y: 2375, version: "9", realDevice: false },
  "Sam's Galaxy": { X: 1080, Y: 1920, version: "7.0", realDevice: true },
  "Nexus 6": { X: 1440, Y: 2392, version: "7", realDevice: true },
  "Galaxy S8": { X: 1080, Y: 2076, version: "9", realDevice: true },
  "Moto G3": { X: 720, Y: 1184, version: "6", realDevice: true }, // Fails at RDT
  "Moto G5": { X: 1080, Y: 1776, version: "8", realDevice: true },
  "LG X300": { X: 720, Y: 1187, version: "8.1", realDevice: true }, // Sometimes can't get into demo mode
  "LG K7": { X: 480, Y: 782, version: "5.1", realDevice: true }, // Dies because COPY button not on screen
  Pixel: { X: 1080, Y: 1794, version: "9", realDevice: true },
};

const device = process.env.TEST_UI_DEVICE
  ? process.env.TEST_UI_DEVICE
  : "Android Emulator";

if (!(device in device_list)) {
  throw `${device} is not an accepted device`;
}

const apk = device_list[device].realDevice
  ? "audere/FluStudy_au/android/app/build/outputs/apk/debug/app-armeabi-v7a-debug.apk"
  : "audere/FluStudy_au/android/app/build/outputs/apk/debug/app-x86-debug.apk";

const PLATFORM = "Android";
const config = {
  platformName: "Android",
  platformVersion: device_list[device].version,
  deviceName: device,
  app: path.join(os.homedir(), apk),
  automationName: "UiAutomator2",
  appWaitForLaunch: false,
};

const SCREEN_X = device_list[device].X;
const SCREEN_Y = device_list[device].Y;
const SIMULATOR = !device_list[device].realDevice;
module.exports = { PLATFORM, config, SCREEN_X, SCREEN_Y, SIMULATOR };
