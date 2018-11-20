import uuidv4 from "uuid/v4";

export type FormAction =
  | { type: "START_FORM" }
  | { type: "SET_AGE"; age: number }
  | { type: "SET_MONTHS"; months: number }
  | {
      type: "SET_ADVERSE_EVENT_TYPES";
      adverseEventTypes: Map<string, boolean>;
    }
  | { type: "SET_ADVERSE_EVENTS"; adverseEvents: string[] }
  | { type: "SET_SIGNATURE_PNG"; signatureBase64: string }
  | { type: "SET_SYMPTOMS"; symptoms: Map<string, boolean> }
  | { type: "SET_EMAIL"; email: string }
  | { type: "SET_EMAIL_OPTIONS"; emailOptions: Map<string, boolean> }
  | {
      type: "SET_SURVEY_RESPONSES";
      surveyResponses: Map<string, SurveyResponse>;
    }
  | {
      type: "SET_ADVERSE_EVENT_TYPES";
      adverseEventTypes: Map<string, boolean>;
    }
  | { type: "SET_ADVERSE_EVENTS"; adverseEvents: string[] };

export interface Address {
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
}

export interface SurveyAnswer {
  addressInput?: Address;
  dateInput?: Date;
  options?: Map<string, boolean>;
  otherOption?: string;
  numberInput?: number;
  selectedButtonKey?: string;
  textInput?: string;
}

export interface SurveyResponse {
  answer?: SurveyAnswer;
  buttonOptions?: Map<string, string>;
  optionKeysToLabel?: Map<string, string>;
  questionId?: string;
  questionText?: string;
}

export type FormState = null | {
  formId?: string;
  age?: number;
  months?: number;
  symptoms?: Map<string, boolean>;
  email?: string;
  signatureBase64?: string;
  emailOptions?: Map<string, boolean>;
  surveyResponses?: Map<string, SurveyResponse>;
  adverseEventTypes?: Map<string, boolean>;
  adverseEvents?: string[];
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
  if (action.type === "SET_SYMPTOMS") {
    return { ...state, symptoms: action.symptoms };
  }
  if (action.type === "SET_EMAIL") {
    return { ...state, email: action.email };
  }
  if (action.type === "SET_SIGNATURE_PNG") {
    return { ...state, signatureBase64: action.signatureBase64 };
  }
  if (action.type === "SET_EMAIL_OPTIONS") {
    return { ...state, emailOptions: action.emailOptions };
  }
  if (action.type === "SET_SURVEY_RESPONSES") {
    return { ...state, surveyResponses: action.surveyResponses };
  }
  if (action.type === "SET_ADVERSE_EVENT_TYPES") {
    return { ...state, adverseEventTypes: action.adverseEventTypes };
  }
  if (action.type === "SET_ADVERSE_EVENTS") {
    return { ...state, adverseEvents: action.adverseEvents };
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

export function setSymptoms(symptoms: Map<string, boolean>): FormAction {
  return {
    type: "SET_SYMPTOMS",
    symptoms,
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

export function setEmailOptions(
  emailOptions: Map<string, boolean>
): FormAction {
  return {
    type: "SET_EMAIL_OPTIONS",
    emailOptions,
  };
}

export function setSurveyResponses(
  surveyResponses: Map<string, SurveyResponse>
): FormAction {
  console.log("SURVEY RESPONSES=");
  surveyResponses.forEach((value: SurveyResponse, key: string) => {
    console.log(key, value);
  });
  return {
    type: "SET_SURVEY_RESPONSES",
    surveyResponses,
  };
}

export function setAdverseEventTypes(
  adverseEventTypes: Map<string, boolean>
): FormAction {
  return {
    type: "SET_ADVERSE_EVENT_TYPES",
    adverseEventTypes,
  };
}

export function setAdverseEvents(adverseEvents: string[]): FormAction {
  console.log("Saving adverse events=" + adverseEvents);
  return {
    type: "SET_ADVERSE_EVENTS",
    adverseEvents,
  };
}
