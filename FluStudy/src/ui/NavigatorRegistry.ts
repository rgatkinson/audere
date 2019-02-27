import React from "react";
import { NavigationContainer } from "react-navigation";

let appNavigator: NavigationContainer | null;

export function registerNavigator(navigator: NavigationContainer) {
  appNavigator = navigator;
}

export function getAppNavigator(): NavigationContainer | null {
  return appNavigator;
}
