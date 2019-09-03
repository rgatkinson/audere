// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

jest.mock("react-native-device-info", () => {
  return {
    getInstanceID: jest.fn,
    getBuildNumber: jest.fn,
    getDeviceType: jest.fn,
    getSystemName: jest.fn,
    getSystemVersion: jest.fn,
  };
});

jest.mock("react-native", () => ({
  NativeModules: {
    I18nManager: {
      localeIdentifier: "DRC",
    },
    RNDeviceInfo: {
      appVersion: 2.1,
      buildNumber: 12,
      model: "android",
      systemName: "android",
      systemVersion: "10.3",
    },
  },
  StyleSheet: {
    create: () => ({}),
  },
  Platform: {
    OS: jest.fn(() => "android"),
    version: jest.fn(() => 25),
  },
  Dimensions: {
    get: () => ({ width: 500, height: 500 }),
  },
  ActivityIndicator: "ActivityIndicator",
}));

const React = require("react-native");

React.I18nManager = {
  isRTL: false,
  allowRTL: () => {},
  forceRTL: () => {},
};

jest.mock("react-native-firebase", () => {
  return {
    messaging: jest.fn(() => {
      return {
        hasPermission: jest.fn(() => Promise.resolve(true)),
        subscribeToTopic: jest.fn(),
        unsubscribeFromTopic: jest.fn(),
        requestPermission: jest.fn(() => Promise.resolve(true)),
        getToken: jest.fn(() => Promise.resolve("myMockToken")),
      };
    }),
    notifications: jest.fn(() => {
      return {
        onNotification: jest.fn(),
        onNotificationDisplayed: jest.fn(),
      };
    }),
  };
});

jest.mock("react-native-camera", () => {
  return {
    RNCamera: jest.fn(),
  };
});

jest.mock("@react-native-community/geolocation", () => {
  return {
    getCurrentPosition: () => {
      return { haveLocation: true, lat: 1, long: 1 };
    },
  };
});

jest.mock("@react-native-community/netinfo", () => {
  return {
    addEventListener: () => console.log("Added NetInfo Event Listener"),
  };
});

jest.mock("react-native-fs", () => {
  return {
    RNFS: {
      addEventListener: () => console.log("Added FS Event Listener"),
    },
  };
});
