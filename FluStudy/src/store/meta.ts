import { updateCollectionEnabled } from "../util/tracker";

export type MetaAction =
  | { type: "SET_ACTIVE_ROUTE_NAME"; activeRouteName: string }
  | { type: "SET_CONNECTIVITY"; isConnected: boolean }
  | { type: "SET_OFFLINE_WARNING"; shownOfflineWarning: boolean }
  | { type: "SET_DEMO"; isDemo: boolean }
  | { type: "SET_MARKETING_PROPERTIES"; marketingProperties: any }
  | { type: "TOGGLE_SUPPORT_CODE_MODAL" };

export type MetaState = {
  activeRouteName: string;
  isConnected: boolean;
  isDemo: boolean;
  marketingProperties: any;
  shownOfflineWarning: boolean;
  supportCodeModalVisible: boolean;
};

const initialState: MetaState = {
  activeRouteName: "Welcome",
  isConnected: true,
  isDemo: false,
  marketingProperties: undefined,
  shownOfflineWarning: false,
  supportCodeModalVisible: false,
};

export default function reducer(state = initialState, action: MetaAction) {
  switch (action.type) {
    case "SET_ACTIVE_ROUTE_NAME":
      return { ...state, activeRouteName: action.activeRouteName };
    case "SET_DEMO":
      return { ...state, isDemo: action.isDemo };
    case "SET_MARKETING_PROPERTIES":
      return { ...state, marketingProperties: action.marketingProperties };
    case "SET_OFFLINE_WARNING":
      return { ...state, shownOfflineWarning: action.shownOfflineWarning };
    case "SET_CONNECTIVITY":
      return { ...state, isConnected: action.isConnected };
    case "TOGGLE_SUPPORT_CODE_MODAL":
      return {
        ...state,
        supportCodeModalVisible: !state.supportCodeModalVisible,
      };
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

export function toggleSupportCodeModal(): MetaAction {
  return {
    type: "TOGGLE_SUPPORT_CODE_MODAL",
  };
}
