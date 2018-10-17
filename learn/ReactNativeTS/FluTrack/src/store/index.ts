import { createStore, combineReducers } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

import {
  default as user,
  State as UserState,
  Action as UserAction,
} from "./user";
export * from "./user";

import {
  default as form,
  State as FormState,
  Action as FormAction,
} from "./form";
export * from "./form";

export type Action = UserAction | FormAction;

export interface StoreState {
  user: UserState;
  form: FormState;
}

const config = {
  key: "store",
  storage,
};

const reducer = combineReducers({
  user,
  form,
});

export const store = createStore(persistReducer(config, reducer));
export const persistor = persistStore(store);
