import { createStore } from "redux";
import { SET_ID, SET_PASSWORD, SET_AGE } from "./Constants";

const initialState = {
  id: "",
  password: "",
  age: 0
};

const reducer = (state = initialState, action: any) => {
  //console.log("reducer running", action);
  switch (action.type) {
    case SET_ID:
      return Object.assign({}, state, { id: action.payload });
    case SET_PASSWORD:
      return Object.assign({}, state, { password: action.payload });
    case SET_AGE:
      return Object.assign({}, state, { age: action.payload });
    default:
      return state;
  }
};

const store = createStore(reducer);

export default store;
