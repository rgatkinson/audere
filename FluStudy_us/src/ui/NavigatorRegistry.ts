// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { NavigationContainer } from "react-navigation";

let appNavigator: NavigationContainer | null;

export function registerNavigator(navigator: NavigationContainer) {
  appNavigator = navigator;
}

export function getAppNavigator(): NavigationContainer | null {
  return appNavigator;
}
