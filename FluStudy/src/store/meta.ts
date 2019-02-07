export type MetaAction = { type: "SET_DEMO"; isDemo: boolean };

export type MetaState = {
  isDemo: boolean;
};

const initialState: MetaState = {
  isDemo: false,
};

export default function reducer(state = initialState, action: MetaAction) {
  if (action.type === "SET_DEMO") {
    return { ...state, isDemo: action.isDemo };
  }

  return state;
}

export function setDemo(isDemo: boolean): MetaAction {
  return {
    type: "SET_DEMO",
    isDemo,
  };
}
