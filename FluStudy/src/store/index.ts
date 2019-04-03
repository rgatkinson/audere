import {
  createStore,
  combineReducers,
  applyMiddleware,
  Store,
  Middleware,
  Dispatch,
  AnyAction,
  MiddlewareAPI,
} from "redux";
import { persistStore, persistReducer, createTransform } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { Transform } from "redux-persist/es/createTransform";
import createEncryptor from "redux-persist-transform-encrypt";
import immutableTransform from "redux-persist-transform-immutable";
import { logger, uploader, uploaderMiddleware } from "./uploader";
import { crashlytics, crashReportingDetailsMiddleware } from "../crashReporter";

export { uploader, events, logger } from "./uploader";

export * from "./types";

import { default as meta, MetaAction } from "./meta";
export * from "./meta";

import { default as survey, SurveyAction } from "./survey";
export * from "./survey";

type ClearStateAction = { type: "CLEAR_STATE" };
export function clearState(): ClearStateAction {
  return { type: "CLEAR_STATE" };
}

export type Action = MetaAction | SurveyAction | ClearStateAction;

import { StoreState } from "./StoreState";
export { StoreState } from "./StoreState";

const reducer = combineReducers({
  meta,
  navigation: (state: any = {}) => null,
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

export const encryptionRemovalTransform = (encryptor: Transform<any, any>) =>
  createTransform(
    (inboundState, key) => {
      return inboundState;
    },
    (outboundState, key) => {
      const decrypted = encryptor.out(outboundState, key);
      if (decrypted) {
        logger.debug(`Persisted redux state "${key}" no longer encrypted.`);
        return JSON.stringify(decrypted);
      }
      return outboundState;
    }
  );

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
  const password = await uploader.getEncryptionPassword();
  const encryptor = createEncryptor({ secretKey: password });
  const persistConfig = {
    transforms: [immutableTransform(), encryptionRemovalTransform(encryptor)],
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
