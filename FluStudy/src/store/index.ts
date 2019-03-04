import { createStore, combineReducers, applyMiddleware, Store } from "redux";
import { persistStore, persistReducer, createTransform } from "redux-persist";
import { createReactNavigationReduxMiddleware } from "react-navigation-redux-helpers";
import { NavigationAction } from "react-navigation";
import storage from "redux-persist/lib/storage";
import { Transform } from "redux-persist/es/createTransform";
import createEncryptor from "redux-persist-transform-encrypt";
import immutableTransform from "redux-persist-transform-immutable";
import { uploader, uploaderMiddleware } from "./uploader";

export { uploader, events, logger } from "./uploader";

export * from "./types";

import { default as meta, MetaState, MetaAction } from "./meta";
export * from "./meta";

import {
  default as navigation,
  navigationLoggingMiddleware,
  firebaseNavigationLoggingMiddleware,
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

let storePromise: Promise<Store>;
export function getStore(): Promise<Store> {
  if (storePromise) {
    return storePromise;
  }
  return (storePromise = getStoreImpl());
}

const encryptingTransform = (encryptor: Transform<any, any>) =>
  createTransform(
    (inboundState, key) => {
      return encryptor.in(JSON.parse(inboundState as string), key);
    },
    (outboundState, key) => {
      return JSON.stringify(encryptor.out(outboundState, key));
    }
  );

async function getStoreImpl() {
  const password = await uploader.getEncryptionPassword();
  const encryptor = createEncryptor({ secretKey: password });
  const persistConfig = {
    transforms: [immutableTransform(), encryptingTransform(encryptor)],
    key: "store",
    storage,
  };
  return createStore(
    persistReducer(persistConfig, rootReducer),
    applyMiddleware(
      firebaseNavigationLoggingMiddleware,
      navigationMiddleware,
      navigationLoggingMiddleware,
      uploaderMiddleware
    )
  );
}

export async function getPersistor() {
  return persistStore(await getStore());
}
