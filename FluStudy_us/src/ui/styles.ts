// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Dimensions, Platform, StatusBar } from "react-native";
import DeviceInfo from "react-native-device-info";

const X_WIDTH = 375;
const X_HEIGHT = 812;

const XSMAX_WIDTH = 414;
const XSMAX_HEIGHT = 896;

const SE_HEIGHT = 568;
const SE_WIDTH = 320;

const { height: W_HEIGHT, width: W_WIDTH } = Dimensions.get("window");
let isIPhoneX = false;
let isIPhoneSE = false;

isIPhoneX =
  (W_WIDTH === X_WIDTH && W_HEIGHT === X_HEIGHT) ||
  (W_WIDTH === XSMAX_WIDTH && W_HEIGHT === XSMAX_HEIGHT);

isIPhoneSE =
  (W_WIDTH === SE_WIDTH && W_HEIGHT === SE_HEIGHT) ||
  Math.abs(W_HEIGHT - SE_HEIGHT) + Math.abs(W_WIDTH - SE_WIDTH) < 100;

export const isTablet = DeviceInfo.isTablet();
export const PRIMARY_COLOR = "#352A6E";
export const SECONDARY_COLOR = "#7065AB";
export const TEXT_COLOR = "#525760";
export const LIGHT_COLOR = "#25AAE1";
export const ERROR_COLOR = "#DA1C63";
export const RED = "#EF5253";
export const LINK_COLOR = "#7065AB";
export const PROGRESS_COLOR = "#7BAA22";
export const GUTTER = isIPhoneSE ? 16 : 24;
export const SCREEN_MARGIN = isTablet ? 79 : GUTTER * 1.5;
export const FONT_EXTRA_BOLD = "ExtraBold";
export const FONT_ITALIC = "Italic";
export const FONT_NORMAL = "Regular";
export const FONT_SEMI_BOLD = "SemiBold";
export const FONT_BOLD = "Bold";
export const BORDER_COLOR = "#bbb";
export const DISABLED_COLOR = "#CAD2D8";
export const BORDER_RADIUS = 20;
export const BUTTON_BORDER_RADIUS = 6;
export const BORDER_WIDTH = 1;
export const THIN_BORDER_WIDTH = 1;
export const THICK_BORDER_WIDTH = 3;
export const EXTRA_LARGE_TEXT = isTablet ? 40 : 32;
export const LARGE_TEXT = isTablet ? 28 : 24;
export const REGULAR_TEXT = isTablet ? 24 : 22;
export const SMALL_TEXT = isTablet ? 20 : 18;
export const EXTRA_SMALL_TEXT = 16;
export const IMAGE_MARGIN = isIPhoneSE ? 24 : 32;
export const BUTTON_WIDTH = isTablet ? 360 : 240;
export const INPUT_HEIGHT = isTablet ? 60 : 44;
export const INPUT_TEXT = isTablet ? 26 : REGULAR_TEXT;
export const RADIO_BUTTON_HEIGHT = 50;
export const FOOTER_HEIGHT = isTablet ? 75 : 50;
export const RADIO_INPUT_HEIGHT = 26;
export const SYSTEM_TEXT = 17;
export const SYSTEM_FONT = "System";
export const SYSTEM_PADDING_BOTTOM = isIPhoneX ? 20 : 0;
export const STATUS_BAR_COLOR = "#F8F8F8";
export const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight! : isIPhoneX ? 44 : 20;
export const NAV_BAR_HEIGHT = 40;
export const LOGO_HEIGHT = 120;
export const IMAGE_WIDTH = isIPhoneSE || isTablet ? "75%" : "100%";
export const IMAGE_WIDTH_SQUARE = isIPhoneSE || isTablet ? "50%" : "65%";
export const SPLASH_IMAGE = {
  uri: isTablet ? "largesplash" : isIPhoneSE ? "mediumsplash" : "splash",
};
export const SPLASH_RATIO = isTablet ? 1.3 : isIPhoneSE ? 1.26 : 1.05;
export const BG_RATIO = isTablet ? 0.65 : isIPhoneSE ? 0.695 : 0.63;
export const BG_IMAGE = {
  uri: isTablet ? "largebg" : isIPhoneSE ? "mediumbg" : "bg",
};
export const ASPECT_RATIO = 1.75;
export const VIDEO_ASPECT_RATIO = 1920 / 1080;
export const KEYBOARD_BEHAVIOR =
  Platform.OS === "android" ? undefined : "padding";
export const HIGHLIGHT_STYLE = { borderWidth: 1, borderColor: "red" };
export const LINE_HEIGHT_DIFFERENCE = 8;
export const CUSTOM_BULLET_OFFSET = isTablet ? 0 : isIPhoneSE ? 2 : 3;
export const FEATHER_SIZE = 20;
