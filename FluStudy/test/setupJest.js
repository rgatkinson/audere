// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// See https://github.com/expo/expo/issues/1705
require("stacktrace-parser");

// Original template from https://medium.com/@rui.fernandes/react-native-jest-react-native-firebase-b5245d8ddd1
jest.mock("react-native-firebase", () => {
  return {
    analytics: jest.fn(() => {
      return {
        setAnalyticsCollectionEnabled: jest.fn(),
        setCurrentScreen: jest.fn(),
        logEvent: jest.fn(),
      };
    }),
  };
});
