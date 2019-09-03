// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

module.exports = {
  preset: "react-native",
  setupFilesAfterEnv: ["./setupJest"],
  setupFiles: ["./jestSetup.js"],
  moduleFileExtensions: ["ts", "tsx", "js"],
  transform: {
    "\\.(js)$": "babel-jest",
    "\\.(ts|tsx)$": "ts-jest",
  },
  testMatch: [
    "**/__tests__/**/*.(ts|js)?(x)",
    "**/?(*.)+(spec|test).(ts|js)?(x)",
  ],
  testPathIgnorePatterns: ["\\.snap$", "<rootDir>/node_modules/", "appium.*"],
  transformIgnorePatterns: ["<rootDir>/node_modules/"],
  // transformIgnorePatterns: [
  //   "node_modules/(?!((jest-|pouchdb-)?react-native|(@)?expo|(@)?unimodules|(@)?react-navigation|@react-native-community/netinfo))",
  // ],
};
