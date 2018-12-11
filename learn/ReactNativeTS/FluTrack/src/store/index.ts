import { createStore, combineReducers, applyMiddleware } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import immutableTransform from "redux-persist-transform-immutable";

import { uploaderMiddleware } from "./uploader";

import { default as user, UserState, UserAction } from "./user";
export * from "./user";

import { default as form, FormState, FormAction } from "./form";
export * from "./form";

import { default as admin, AdminState, AdminAction } from "./admin";
export * from "./admin";

export type Action = UserAction | FormAction | AdminAction;

export { StoreState } from "./StoreState";

const persistConfig = {
  transforms: [immutableTransform()],
  key: "store",
  storage,
};

const reducer = combineReducers({
  user,
  form,
  admin,
});

export const store = createStore(
  persistReducer(persistConfig, reducer),
  applyMiddleware(uploaderMiddleware)
);
export const persistor = persistStore(store);
