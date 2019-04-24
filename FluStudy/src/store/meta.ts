import { updateCollectionEnabled } from "../util/tracker";

export type MetaAction =
  | { type: "SET_CONNECTIVITY"; isConnected: boolean }
  | { type: "SET_OFFLINE_WARNING"; shownOfflineWarning: boolean }
  | { type: "SET_DEMO"; isDemo: boolean }
  | { type: "SET_MARKETING_PROPERTIES"; marketingProperties: any };

export type MetaState = {
  isConnected: boolean;
  isDemo: boolean;
  marketingProperties: any;
  shownOfflineWarning: boolean;
};

const initialState: MetaState = {
  isConnected: false,
  isDemo: false,
  marketingProperties: undefined,
  shownOfflineWarning: false,
};

export default function reducer(state = initialState, action: MetaAction) {
  switch (action.type) {
    case "SET_DEMO":
      return { ...state, isDemo: action.isDemo };
    case "SET_MARKETING_PROPERTIES":
      return { ...state, marketingProperties: action.marketingProperties };
    case "SET_OFFLINE_WARNING":
      return { ...state, shownOfflineWarning: action.shownOfflineWarning };
    case "SET_CONNECTIVITY":
      return { ...state, isConnected: action.isConnected };
    default:
      return state;
  }
}

export function setDemo(isDemo: boolean): MetaAction {
  updateCollectionEnabled(isDemo);
  return {
    type: "SET_DEMO",
    isDemo,
  };
}

export function setMarketingProperties(marketingProperties: any): MetaAction {
  return {
    type: "SET_MARKETING_PROPERTIES",
    marketingProperties,
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
