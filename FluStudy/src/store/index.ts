import { createStore, combineReducers, applyMiddleware } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import immutableTransform from "redux-persist-transform-immutable";

import { uploaderMiddleware } from "./uploader";

export * from "./types";

import { default as meta, MetaState, MetaAction } from "./meta";
export * from "./meta";

import { default as survey, SurveyState, SurveyAction } from "./survey";
export * from "./survey";

export type Action = MetaAction | SurveyAction;

export { StoreState } from "./StoreState";

const persistConfig = {
  transforms: [immutableTransform()],
  key: "store",
  storage,
};

const reducer = combineReducers({
  meta,
  survey,
});

export const store = createStore(
  persistReducer(persistConfig, reducer),
  applyMiddleware(uploaderMiddleware)
);
export const persistor = persistStore(store);
