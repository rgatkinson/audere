import { updateCollectionEnabled } from "../util/tracker";

export type MetaAction =
  | { type: "SET_DEMO"; isDemo: boolean }
  | { type: "SET_MARKETING_PROPERTIES"; marketingProperties: any };

export type MetaState = {
  isDemo: boolean;
  marketingProperties: any;
};

const initialState: MetaState = {
  isDemo: false,
  marketingProperties: undefined,
};

export default function reducer(state = initialState, action: MetaAction) {
  if (action.type === "SET_DEMO") {
    return { ...state, isDemo: action.isDemo };
  }
  if (action.type === "SET_MARKETING_PROPERTIES") {
    return { ...state, marketingProperties: action.marketingProperties };
  }

  return state;
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
