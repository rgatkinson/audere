import { Dimensions, NativeModules } from "react-native";
const { PlatformConstants } = NativeModules;
const deviceType = PlatformConstants.interfaceIdiom;

const X_WIDTH = 375;
const X_HEIGHT = 812;

const XSMAX_WIDTH = 414;
const XSMAX_HEIGHT = 896;

const { height: W_HEIGHT, width: W_WIDTH } = Dimensions.get("window");

let isIPhoneX = false;

if (deviceType === "phone") {
  isIPhoneX =
    (W_WIDTH === X_WIDTH && W_HEIGHT === X_HEIGHT) ||
    (W_WIDTH === XSMAX_WIDTH && W_HEIGHT === XSMAX_HEIGHT);
}

export const PRIMARY_COLOR = "#333";
export const SECONDARY_COLOR = "#666";
export const LIGHT_COLOR = "#979797";
export const ERROR_COLOR = "red";
export const LINK_COLOR = "#007AFF";
export const GUTTER = 16;
export const FONT_EXTRA_BOLD = "OpenSans-ExtraBold";
export const FONT_NORMAL = "OpenSans-Regular";
export const FONT_SEMI_BOLD = "OpenSans-SemiBold";
export const FONT_BOLD = "OpenSans-Bold";
export const BORDER_COLOR = "#bbb";
export const DISABLED_COLOR = BORDER_COLOR;
export const BORDER_RADIUS = 5;
export const BORDER_WIDTH = 2;
export const THIN_BORDER_WIDTH = 1;
export const EXTRA_LARGE_TEXT = 24;
export const LARGE_TEXT = 20;
export const REGULAR_TEXT = 16;
export const SMALL_TEXT = 14;
export const INPUT_HEIGHT = 40;
export const SYSTEM_TEXT = 17;
export const SYSTEM_FONT = "System";
export const SYSTEM_PADDING_BOTTOM = isIPhoneX ? 20 : 0;
export const STATUS_BAR_COLOR = "#F8F8F8";
export const STATUS_BAR_HEIGHT = isIPhoneX ? 44 : 20;
export const NAV_BAR_HEIGHT = 40;
export const LOGO_HEIGHT = 120;
