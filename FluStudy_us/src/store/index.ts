// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  AnyAction,
  applyMiddleware,
  combineReducers,
  createStore,
  Dispatch,
  Middleware,
  MiddlewareAPI,
  Store,
} from "redux";
import { persistReducer, persistStore } from "redux-persist";
import immutableTransform from "redux-persist-transform-immutable";
import storage from "redux-persist/lib/storage";
import { crashlytics, crashReportingDetailsMiddleware } from "../crashReporter";
import { PhotoUploader } from "../transport/PhotoUploader";
import { photoCollectionName } from "./FirebaseStore";
import { default as meta, MetaAction } from "./meta";
import { default as questions, QuestionsAction } from "./questions";
import { StoreState } from "./StoreState";
import { default as survey, SurveyAction } from "./survey";
import { uploaderMiddleware } from "./uploader";

export * from "./meta";
export * from "./questions";
export { StoreState } from "./StoreState";
export * from "./survey";
export * from "./types";

type ClearStateAction = { type: "CLEAR_STATE" };
export function clearState(): ClearStateAction {
  return { type: "CLEAR_STATE" };
}

export type Action =
  | MetaAction
  | QuestionsAction
  | SurveyAction
  | ClearStateAction;

const reducer = combineReducers({
  meta,
  navigation: (state: any = {}) => null,
  questions,
  survey,
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

const photoUploader = new PhotoUploader({
  collection: photoCollectionName(),
});

export function uploadFile(uid: string, filepath: string) {
  return photoUploader.enqueueFileContents(uid, filepath);
}

export function uploadBase64String(photoId: string, base64String: string) {
  return photoUploader.enqueueFileContents(photoId, base64String);
}

export async function hasPendingPhotos() {
  return await photoUploader.hasPendingPhotos();
}

export async function waitForIdlePhotoUploader(ms?: number) {
  return await photoUploader.waitForIdle(ms);
}

function loggingMiddleware<Ext, S, D extends Dispatch>(
  label: string,
  middleware: Middleware<Ext, S, D>
): Middleware<Ext, S, D> {
  return (store: MiddlewareAPI<D, S>) => {
    const inner0 = middleware(store);
    return (next: Dispatch) => {
      const inner1 = inner0(next);
      return (action: AnyAction) => {
        const before = `middleware[${label}] ${action}`;
        if (!store) {
          crashlytics.log(`${before} (store='${store}')`);
        } else if (!store.getState()) {
          crashlytics.log(`${before} (store.getState()='${store.getState()}')`);
        } else {
          crashlytics.log(before);
        }

        const result = inner1(action);

        crashlytics.log(`middleware[${label}] ${action} -> ${result}`);
        return result;
      };
    };
  };
}

async function getStoreImpl() {
  const persistConfig = {
    transforms: [immutableTransform()],
    key: "store",
    storage,
  };
  return createStore(
    persistReducer(persistConfig, rootReducer),
    applyMiddleware(
      loggingMiddleware("CrashReport", crashReportingDetailsMiddleware),
      loggingMiddleware("Upload", uploaderMiddleware)
    )
  );
}

export async function getPersistor() {
  return persistStore(await getStore());
}
