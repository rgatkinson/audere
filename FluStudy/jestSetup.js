import { NativeModules as RNNativeModules } from "react-native";
import crypto from 'crypto';

RNNativeModules.UIManager = RNNativeModules.UIManager || {};
RNNativeModules.UIManager.RCTView = RNNativeModules.UIManager.RCTView || {};
RNNativeModules.RNGestureHandlerModule = RNNativeModules.RNGestureHandlerModule || {
  State: { BEGAN: "BEGAN", FAILED: "FAILED", ACTIVE: "ACTIVE", END: "END" },
  attachGestureHandler: jest.fn(),
  createGestureHandler: jest.fn(),
  dropGestureHandler: jest.fn(),
  updateGestureHandler: jest.fn(),

};
RNNativeModules.PlatformConstants = RNNativeModules.PlatformConstants || {
  forceTouchAvailable: false
};

Object.defineProperty(global, "crypto", {
  value: {
    getRandomValues: arr => crypto.randomBytes(arr.length),
  },
});

jest.mock("react-native-background-timer", () => {});

jest.mock('react-native-sound', () => 'Sound')
