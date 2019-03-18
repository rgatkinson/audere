import { updateCollectionEnabled } from "../util/tracker";

export type MetaAction =
  | { type: "SET_DEMO"; isDemo: boolean }
  | { type: "SET_MARKETING_PROPERTIES"; marketingProperties: any }
  | { type: "SKIP_PART_ONE"; skipPartOne: boolean };

export type MetaState = {
  isDemo: boolean;
  skipPartOne: boolean;
  marketingProperties: any;
};

const initialState: MetaState = {
  isDemo: false,
  skipPartOne: false,
  marketingProperties: undefined,
};

export default function reducer(state = initialState, action: MetaAction) {
  if (action.type === "SET_DEMO") {
    return { ...state, isDemo: action.isDemo };
  }
  if (action.type === "SET_MARKETING_PROPERTIES") {
    return { ...state, marketingProperties: action.marketingProperties };
  }
  if (action.type === "SKIP_PART_ONE") {
    return { ...state, skipPartOne: action.skipPartOne };
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

export function skipPartOne(skipPartOne: boolean): MetaAction {
  return {
    type: "SKIP_PART_ONE",
    skipPartOne,
  };
}
