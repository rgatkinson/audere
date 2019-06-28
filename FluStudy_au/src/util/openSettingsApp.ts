// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Linking, Platform, NativeModules } from "react-native";

export function openSettingsApp() {
  if (Platform.OS === "ios") {
    Linking.openURL("app-settings://");
  } else {
    NativeModules.OpenAppSettingsModule.openAppSettings();
  }
}
