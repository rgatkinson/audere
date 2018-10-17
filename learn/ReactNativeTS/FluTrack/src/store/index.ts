import { createStore } from "redux";
import { SET_ID, SET_PASSWORD, SET_AGE } from "./Constants";

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

const store = createStore(reducer);

export default store;
