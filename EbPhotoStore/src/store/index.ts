// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  applyMiddleware,
  createStore,
  combineReducers,
  Store,
  Middleware,
  Dispatch,
  AnyAction,
  MiddlewareAPI,
} from "redux";
import { persistStore, persistReducer, createTransform } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { Transform } from "redux-persist/es/createTransform";
import immutableTransform from "redux-persist-transform-immutable";

import { StoreState } from "./StoreState";
export { StoreState } from "./StoreState";

import { default as meta, MetaAction } from "./meta";
export * from "./meta";

import { default as patients, PatientAction } from "./patients";
export * from "./patients";

import { default as photoUploads, PhotoUploadAction } from "./photoUploads";
export * from "./photoUploads";

import { uploaderMiddleware } from "./uploader";

type ClearStateAction = { type: "CLEAR_STATE" };
export function clearState(): ClearStateAction {
  return { type: "CLEAR_STATE" };
}

export type Action =
  | MetaAction
  | PatientAction
  | ClearStateAction
  | PhotoUploadAction;

const reducer = combineReducers({
  meta,
  patients,
  photoUploads,
});

const rootReducer = (state: StoreState | undefined, action: Action) => {
  if (action.type === "CLEAR_STATE") {
    if (state != null) {
      Object.keys(state).forEach(key => {
        storage.removeItem(`persist:${key}`);
      });
    }
    state = undefined;
  }
  return reducer(state, action);
};

let storePromise: Promise<Store>;
export function getStore(): Promise<Store> {
  if (storePromise) {
    return storePromise;
  }
  return (storePromise = getStoreImpl());
}

async function getStoreImpl() {
  const persistConfig = {
    transforms: [immutableTransform()],
    key: "store",
    storage,
  };
  const store = await createStore(
    persistReducer(persistConfig, rootReducer),
    applyMiddleware(uploaderMiddleware)
  );
  return store;
}

export async function getPersistor() {
  return persistStore(await getStore());
}
