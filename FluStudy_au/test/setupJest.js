// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// See https://github.com/expo/expo/issues/1705
import * as FileSystem from 'expo-file-system';

require("stacktrace-parser");

// Original template from https://medium.com/@rui.fernandes/react-native-jest-react-native-firebase-b5245d8ddd1
jest.mock("react-native-firebase", () => {
  return {
    analytics: jest.fn(() => {
      return {
        logEvent: jest.fn(),
        setAnalyticsCollectionEnabled: jest.fn(),
        setCurrentScreen: jest.fn(),
        setUserId: jest.fn(),
      };
    }),
    crashlytics: jest.fn(() => {
      return {
        recordError: jest.fn(),
        setUserIdentifier: jest.fn(),
        log: jest.fn(),
      };
    }),
  };
});

jest.mock("react-native-device-info", () => {
  return {
    isEmulator: jest.fn(),
    getDeviceName: jest.fn(),
    getIPAddress: jest.fn(() => {
      return {
        catch: jest.fn(),
      };
    }),
    getUniqueID: jest.fn(),
  };
});

// Mocks expo's FileSystem, default implementations are kind of sane.
// It's not terribly robust about things like checking errors or
// creating parent directories, but it works well enough reading/writing
// files and directories.
jest.mock("expo-file-system", () => {
  return mockFileSystem();
})

function mockFileSystem() {
  const files = new Map();
  const documentDirectory = "TestDocuments/";
  const cacheDirectory = "TestCache/";

  async function delay(item) {
    await new Promise(process.nextTick);
    return item;
  }

  function canonicalize(uri) {
    return uri.endsWith("/") ? uri.substring(0, uri.length - 1) : uri;
  }

  function deleteAsync(uri) {
    const canon = canonicalize(uri);
    [...files.keys()]
      .filter(k => k.startsWith(canon + "/"))
      .forEach(k => files.delete(k));
    files.delete(canon);
    return delay(undefined);
  }

  function getInfoAsync(uri) {
    return delay(files.get(canonicalize(uri)) || { exists: false, isDirectory: false });
  }

  function makeDirectoryAsync(uri) {
    files.set(canonicalize(uri), { exists: true, isDirectory: true, uri });
    return delay(undefined);
  }

  function readAsStringAsync(uri) {
    const entry = files.get(canonicalize(uri));
    if (entry != null) {
      return delay(entry.contents);
    } else {
      throw new Error(`no file at '${uri}'`);
    }
  }

  function readDirectoryAsync(uri) {
    const canon = canonicalize(uri);
    return delay(
      [...files.keys()]
        .filter(k => k.startsWith(canon) && k.lastIndexOf("/") === canon.length)
        .map(k => k.substring(canon.length + 1))
        .sort()
    );
  }

  function writeAsStringAsync(uri, contents) {
    files.set(canonicalize(uri), { exists: true, isDirectory: false, uri, contents });
    return delay(undefined);
  }

  makeDirectoryAsync(documentDirectory);
  makeDirectoryAsync(cacheDirectory);

  function notYetMocked() {
    throw new Error(`${__filename}: mockFileSystem does not yet implement this call`);
  }

  return {
    moveAsync: notYetMocked,
    copyAsync: notYetMocked,
    downloadAsync: notYetMocked,
    createDownloadResumable: notYetMocked,

    documentDirectory: "TestDocuments/",
    cacheDirectory: "TestCache/",
    deleteAsync: jest.fn(deleteAsync),
    getInfoAsync: jest.fn(getInfoAsync),
    makeDirectoryAsync: jest.fn(makeDirectoryAsync),
    readAsStringAsync: jest.fn(readAsStringAsync),
    readDirectoryAsync: jest.fn(readDirectoryAsync),
    writeAsStringAsync: jest.fn(writeAsStringAsync),
    EncodingType: {
      UTF8: "utf8",
      Base64: "base64"
    }
  };
}
