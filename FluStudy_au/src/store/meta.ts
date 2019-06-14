// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { updateCollectionEnabled } from "../util/tracker";

export type MetaAction =
  | { type: "SET_ACTIVE_ROUTE_NAME"; activeRouteName: string }
  | { type: "SET_CONNECTIVITY"; isConnected: boolean }
  | { type: "SET_OFFLINE_WARNING"; shownOfflineWarning: boolean }
  | { type: "SET_DEMO"; isDemo: boolean };

export type MetaState = {
  activeRouteName: string;
  isConnected: boolean;
  isDemo: boolean;
  marketingProperties: any;
  shownOfflineWarning: boolean;
};

const initialState: MetaState = {
  activeRouteName: "Welcome",
  isConnected: true,
  isDemo: false,
  marketingProperties: undefined,
  shownOfflineWarning: false,
};

export default function reducer(state = initialState, action: MetaAction) {
  switch (action.type) {
    case "SET_ACTIVE_ROUTE_NAME":
      return { ...state, activeRouteName: action.activeRouteName };
    case "SET_DEMO":
      return { ...state, isDemo: action.isDemo };
    case "SET_OFFLINE_WARNING":
      return { ...state, shownOfflineWarning: action.shownOfflineWarning };
    case "SET_CONNECTIVITY":
      return { ...state, isConnected: action.isConnected };
    default:
      return state;
  }
}

export function setActiveRouteName(activeRouteName: string): MetaAction {
  return {
    type: "SET_ACTIVE_ROUTE_NAME",
    activeRouteName,
  };
}

export function setDemo(isDemo: boolean): MetaAction {
  updateCollectionEnabled(isDemo);
  return {
    type: "SET_DEMO",
    isDemo,
  };
}

export function setShownOfflineWarning(
  shownOfflineWarning: boolean
): MetaAction {
  return {
    type: "SET_OFFLINE_WARNING",
    shownOfflineWarning,
  };
}

export function setConnectivity(isConnected: boolean): MetaAction {
  return {
    type: "SET_CONNECTIVITY",
    isConnected,
  };
}
