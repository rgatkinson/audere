// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Dimensions, NativeModules, Platform, StatusBar } from "react-native";
const { PlatformConstants } = NativeModules;
const deviceType = PlatformConstants.interfaceIdiom;

export const PRIMARY_COLOR = "#0F5DA7";
export const SECONDARY_COLOR = "#7065AB";
export const TEXT_COLOR = "#4D4D4D";
export const LIGHT_COLOR = "#989898";
export const HIGHLIGHT_COLOR = "#0088FF";
export const TITLEBAR_COLOR = "#F2F2F2";
export const TITLEBAR_TEXT_COLOR = "#2F2F2F";
export const ERROR_COLOR = "#DA1C63";
export const LINK_COLOR = "#7065AB";
export const GUTTER = 16;
export const SCREEN_MARGIN = GUTTER;
export const FONT_COLOR = "#4D4D4D";
export const FONT_COLOR_LIGHT = "#989898";
export const FONT_EXTRA_BOLD = "ExtraBold";
export const FONT_ITALIC = "Italic";
export const FONT_NORMAL = "Regular";
export const FONT_BOLD = "Bold";
export const FONT_ROBO_LIGHT = "Roboto Light";
export const FONT_ROBO_MEDIUM = "Roboto Medium";
export const FONT_ROBO_BOLD = "Roboto Bold";
export const BORDER_COLOR = "#bbb";
export const DISABLED_COLOR = "#CAD2D8";
export const BORDER_RADIUS = 20;
export const BUTTON_BORDER_RADIUS = 4;
export const BORDER_WIDTH = 1;
export const THIN_BORDER_WIDTH = 1;
export const TITLE_TEXT = 28;
export const EXTRA_LARGE_TEXT = 24;
export const LARGE_TEXT = 20;
export const REGULAR_TEXT = 18;
export const IMAGE_MARGIN = 32;
export const SMALL_TEXT = 16;
export const EXTRA_SMALL_TEXT = 14;
export const BUTTON_WIDTH = 240;
export const BUTTON_WIDTH_SM = 180;
export const INPUT_HEIGHT = 50;
export const INPUT_HEIGHT_SM = 36;
export const INPUT_TEXT = REGULAR_TEXT;
export const RADIO_BUTTON_HEIGHT = 50;
export const FOOTER_HEIGHT = 50;
export const RADIO_INPUT_HEIGHT = 23;
export const SYSTEM_TEXT = 17;
export const SYSTEM_FONT = "System";
export const SYSTEM_PADDING_BOTTOM = 0;
export const STATUS_BAR_COLOR = "#F8F8F8";
export const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight! : 20;
export const NAV_BAR_HEIGHT = 40;
export const LOGO_HEIGHT = 120;
export const IMAGE_WIDTH = "100%";
export const SPLASH_IMAGE = { uri: "splash" };
export const TITLE_IMAGE = { uri: "title" };
export const ADD_PHOTO_IMAGE = { uri: "addphoto" };
export const TAKE_PHOTO_LARGE_IMAGE = { uri: "takephotolarge" };
export const TAKE_PHOTO_SMALL_IMAGE = { uri: "takephotosmall" };
export const ASPECT_RATIO = 1.75;
export const VIDEO_ASPECT_RATIO = 1920 / 1080;
export const SPLASH_RATIO = 1.05;
export const KEYBOARD_BEHAVIOR =
  Platform.OS === "android" ? undefined : "padding";
export const HIGHLIGHT_STYLE = { borderWidth: 1, borderColor: "red" };
export const LINE_HEIGHT_DIFFERENCE = 2;
export const CUSTOM_BULLET_OFFSET = 3;
export const FEATHER_SIZE = 20;
export const MENU_ITEM_HEIGHT = 40;
export const MENU_ITEM_WIDTH = 120;
