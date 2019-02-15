import { createStore, combineReducers, applyMiddleware } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import {
  createReactNavigationReduxMiddleware,
  createNavigationReducer,
} from "react-navigation-redux-helpers";
import { NavigationAction } from "react-navigation";
import storage from "redux-persist/lib/storage";
import immutableTransform from "redux-persist-transform-immutable";
import { uploaderMiddleware } from "./uploader";

export * from "./types";

import { default as meta, MetaState, MetaAction } from "./meta";
export * from "./meta";

import {
  default as navigation,
  navigationLoggingMiddleware,
} from "./navigation";
export * from "./navigation";

import { default as survey, SurveyState, SurveyAction } from "./survey";
export * from "./survey";

type ClearStateAction = { type: "CLEAR_STATE" };
export function clearState(): ClearStateAction {
  return { type: "CLEAR_STATE" };
}

export type Action =
  | MetaAction
  | SurveyAction
  | NavigationAction
  | ClearStateAction;

import { StoreState } from "./StoreState";
export { StoreState } from "./StoreState";

const persistConfig = {
  transforms: [immutableTransform()],
  key: "store",
  storage,
};

const reducer = combineReducers({
  meta,
  navigation,
  survey,
});

const rootReducer = (state: StoreState | undefined, action: Action) => {
  if (state != null && action.type === "CLEAR_STATE") {
    Object.keys(state).forEach(key => {
      storage.removeItem(`persist:${key}`);
    });
    state = undefined;
  }
  return reducer(state, action);
};

const navigationMiddleware = createReactNavigationReduxMiddleware(
  (state: StoreState) => state.navigation
);

export const store = createStore(
  persistReducer(persistConfig, rootReducer),
  applyMiddleware(
    navigationMiddleware,
    navigationLoggingMiddleware,
    uploaderMiddleware
  )
);
export const persistor = persistStore(store);
