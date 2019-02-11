import { createStore, combineReducers, applyMiddleware } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import {
  createReactNavigationReduxMiddleware,
  createNavigationReducer,
} from "react-navigation-redux-helpers";
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

import { default as survey, SurveyState, SurveyAction } from "./survey";
export * from "./survey";

export type Action = MetaAction | SurveyAction;

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

const navigationMiddleware = createReactNavigationReduxMiddleware(
  (state: StoreState) => state.navigation
);

export const store = createStore(
  persistReducer(persistConfig, reducer),
  applyMiddleware(
    navigationMiddleware,
    navigationLoggingMiddleware,
    uploaderMiddleware
  )
);
export const persistor = persistStore(store);
