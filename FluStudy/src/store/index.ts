import { createStore, combineReducers, applyMiddleware, Store } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import {
  createReactNavigationReduxMiddleware,
  createNavigationReducer,
} from "react-navigation-redux-helpers";
import { NavigationAction } from "react-navigation";
import storage from "redux-persist/lib/storage";
import createEncryptor from "redux-persist-transform-encrypt";
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

import { uploader } from "./uploader";

export type Action = MetaAction | ScreeningAction | SurveyAction;

export type Action =
  | MetaAction
  | SurveyAction
  | NavigationAction
  | ClearStateAction;

import { StoreState } from "./StoreState";
export { StoreState } from "./StoreState";

const reducer = combineReducers({
  meta,
  navigation,
  survey,
});

let storePromise: Promise<Store>;
export function getStore(): Promise<Store> {
  if (storePromise) {
    return storePromise;
  }
  return (storePromise = getStoreImpl());
}

async function getStoreImpl() {
  const password = await uploader.getEncryptionPassword();
  const persistConfig = {
    transforms: [
      createEncryptor({
        secretKey: password,
        onError(e: Error) {
          console.error(e);
        },
      }),
      immutableTransform(),
    ],
    key: "store",
    storage,
  };
  return createStore(
    persistReducer(persistConfig, reducer),
    applyMiddleware(uploaderMiddleware)
  );
}

export async function getPersistor() {
  return persistStore(await getStore());
}
