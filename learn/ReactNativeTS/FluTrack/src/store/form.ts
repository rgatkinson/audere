export type FormAction = { type: "SET_AGE"; age: number };

export type FormState = {
  age: number;
};

const initialState: FormState = { age: 0 };

export default function reducer(state = initialState, action: FormAction) {
  if (action.type === "SET_AGE") {
    return { ...state, age: action.age };
  }
  return state;
}

export function setAge(age: number): FormAction {
  return {
    type: "SET_AGE",
    age,
  };
}
