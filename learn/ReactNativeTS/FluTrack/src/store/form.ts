import uuidv4 from "uuid/v4";

export type FormAction =
  | { type: "START_FORM" }
  | { type: "SET_AGE"; age: number }
  | { type: "SET_MONTHS"; months: number }
  | { type: "SET_EMAIL"; email: string }
  | { type: "SET_SIGNATURE_PNG"; signatureBase64: string };

export type FormState = null | {
  formId?: string;
  age?: number;
  months?: number;
  email?: string;
  signatureBase64?: string;
};

const initialState: FormState = null;

export default function reducer(state = initialState, action: FormAction) {
  if (action.type === "START_FORM") {
    // Resets all form data
    return { formId: uuidv4() };
  }
  if (action.type === "SET_AGE") {
    return { ...state, age: action.age };
  }
  if (action.type === "SET_MONTHS") {
    return { ...state, months: action.months };
  }
  if (action.type === "SET_EMAIL") {
    return { ...state, email: action.email };
  }
  if (action.type === "SET_SIGNATURE_PNG") {
    return { ...state, signatureBase64: action.signatureBase64 };
  }
  return state;
}

export function startForm(): FormAction {
  return {
    type: "START_FORM",
  };
}

export function setAge(age: number): FormAction {
  return {
    type: "SET_AGE",
    age,
  };
}

export function setMonths(months: number): FormAction {
  return {
    type: "SET_MONTHS",
    months,
  };
}

export function setEmail(email: string): FormAction {
  return {
    type: "SET_EMAIL",
    email,
  };
}

export function setSignaturePng(signatureBase64: string): FormAction {
  return {
    type: "SET_SIGNATURE_PNG",
    signatureBase64,
  };
}
