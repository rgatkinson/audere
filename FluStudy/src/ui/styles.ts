import { Dimensions, NativeModules, Platform, StatusBar } from "react-native";
const { PlatformConstants } = NativeModules;
const deviceType = PlatformConstants.interfaceIdiom;

const X_WIDTH = 375;
const X_HEIGHT = 812;

const XSMAX_WIDTH = 414;
const XSMAX_HEIGHT = 896;

const SE_HEIGHT = 568;
const SE_WIDTH = 320;

const { height: W_HEIGHT, width: W_WIDTH } = Dimensions.get("window");

let isIPhoneX = false;
let isIPhoneSE = false;

if (deviceType === "phone") {
  isIPhoneX =
    (W_WIDTH === X_WIDTH && W_HEIGHT === X_HEIGHT) ||
    (W_WIDTH === XSMAX_WIDTH && W_HEIGHT === XSMAX_HEIGHT);

  isIPhoneSE = W_WIDTH === SE_WIDTH && W_HEIGHT === SE_HEIGHT;
}

export const PRIMARY_COLOR = "#0F5DA7";
export const SECONDARY_COLOR = "#7065AB";
export const TEXT_COLOR = "#525760";
export const LIGHT_COLOR = "#25AAE1";
export const ERROR_COLOR = "#DA1C63";
export const LINK_COLOR = "#7065AB";
export const GUTTER = isIPhoneSE ? 12 : 16;
export const FONT_EXTRA_BOLD = "ExtraBold";
export const FONT_ITALIC = "Italic";
export const FONT_NORMAL = "Regular";
export const FONT_SEMI_BOLD = "SemiBold";
export const FONT_BOLD = "Bold";
export const BORDER_COLOR = "#bbb";
export const DISABLED_COLOR = "#CAD2D8";
export const BORDER_RADIUS = 25;
export const BUTTON_BORDER_RADIUS = 6;
export const BORDER_WIDTH = 1;
export const THIN_BORDER_WIDTH = 1;
export const EXTRA_LARGE_TEXT = 24;
export const LARGE_TEXT = 20;
export const REGULAR_TEXT = 18;
export const SMALL_TEXT = 16;
export const EXTRA_SMALL_TEXT = 14;
export const BUTTON_WIDTH = 220;
export const INPUT_HEIGHT = 40;
export const RADIO_BUTTON_HEIGHT = 50;
export const RADIO_INPUT_HEIGHT = 32;
export const SYSTEM_TEXT = 17;
export const SYSTEM_FONT = "System";
export const SYSTEM_PADDING_BOTTOM = isIPhoneX ? 20 : 0;
export const STATUS_BAR_COLOR = "#F8F8F8";
export const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight! : isIPhoneX ? 44 : 20;
export const NAV_BAR_HEIGHT = 40;
export const LOGO_HEIGHT = 120;
export const IMAGE_WIDTH = isIPhoneSE ? "75%" : "100%";
export const SPLASH_IMAGE = { uri: isIPhoneSE ? "mediumsplash" : "splash" };
export const ASPECT_RATIO = 1.75;
export const VIDEO_ASPECT_RATIO = 1920 / 1080;
export const SPLASH_RATIO = isIPhoneSE ? 1.26 : 1.05;
export const KEYBOARD_BEHAVIOR =
  Platform.OS === "android" ? undefined : "padding";
export const HIGHLIGHT_STYLE = { borderWidth: 1, borderColor: "red" };
