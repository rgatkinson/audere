import { createStore, combineReducers } from "redux";
import { SET_ID, SET_PASSWORD, SET_AGE } from "./Constants";
import {
  default as user,
  State as UserState,
  Action as UserAction,
} from "./user";
export * from "./user";

type Action = UserAction;

interface StoreState {
  user: UserState;
}

const initialState = {
  id: "",
  password: "",
  age: 0,
};

const reducer = (state = initialState, action: any) => {
  switch (action.type) {
    case SET_ID:
      return { ...state, id: action.payload };
    case SET_PASSWORD:
      return { ...state, password: action.payload };
    case SET_AGE:
      return { ...state, age: action.payload };
    default:
      return state;
  }
};

export const store = createStore(
  combineReducers({
    user,
  })
);
