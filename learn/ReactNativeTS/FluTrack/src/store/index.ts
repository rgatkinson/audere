import { createStore, combineReducers, applyMiddleware, Store } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import createEncryptor from "redux-persist-transform-encrypt";
import immutableTransform from "redux-persist-transform-immutable";

import { uploaderMiddleware } from "./uploader";

import { default as form, FormState, FormAction } from "./form";
export * from "./form";

import { default as admin, AdminState, AdminAction } from "./admin";
export * from "./admin";

import { uploader } from "./uploader";

export type Action = FormAction | AdminAction;

export { StoreState } from "./StoreState";

const reducer = combineReducers({
  form,
  admin,
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
