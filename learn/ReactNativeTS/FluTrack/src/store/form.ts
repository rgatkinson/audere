export type Action = { type: "SET_AGE"; age: number };

export type State = {
  age: number;
};

const initialState: State = { age: 0 };

export default function reducer(state = initialState, action: Action) {
  if (action.type === "SET_AGE") {
    return { ...state, age: action.age };
  }
  return state;
}

export function setAge(age: number): Action {
  return {
    type: "SET_AGE",
    age,
  };
}
