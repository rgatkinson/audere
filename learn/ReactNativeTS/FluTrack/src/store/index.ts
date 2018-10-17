import { createStore, combineReducers } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

import {
  default as user,
  State as UserState,
  Action as UserAction,
} from "./user";
export * from "./user";

export type Action = UserAction;

export interface StoreState {
  user: UserState;
}

const initialState = {
  id: "",
  password: "",
  age: 0,
};

const config = {
  key: "store",
  storage,
};

const reducer = combineReducers({
  user,
});

export const store = createStore(persistReducer(config, reducer));
export const persistor = persistStore(store);
