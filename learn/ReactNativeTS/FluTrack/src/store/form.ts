import uuidv4 from "uuid/v4";

import { ConsentInfo, ConsentInfoSignerType } from "audere-lib";

export type FormAction =
  | { type: "START_FORM" }
  | { type: "COMPLETE_SURVEY" }
  | { type: "CLEAR_FORM" }
  | { type: "SET_PARENT_CONSENT"; consent: ConsentInfo }
  | { type: "SET_CONSENT"; consent: ConsentInfo }
  | { type: "SET_BLOOD_CONSENT"; consent: ConsentInfo }
  | { type: "SET_NAME"; name: string }
  | { type: "SET_EMAIL"; email: string }
  | { type: "SET_BLOOD_CONSENT_TERMS"; consentTerms: string }
  | { type: "SET_SAMPLES"; samples: Sample[] }
  | { type: "SET_RESPONSES"; responses: SurveyResponse[] };

export interface Address {
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
}

export interface Sample {
  sampleType: string;
  code: string;
}

export interface Option {
  key: string;
  selected: boolean;
}

export interface SurveyAnswer {
  addressInput?: Address;
  dateInput?: Date;
  options?: Option[];
  otherOption?: string;
  numberInput?: number;
  selectedButtonKey?: string;
  textInput?: string;
  [key: string]: Address | Date | Option[] | string | number | undefined;
}

export interface ButtonLabel {
  key: string;
  label: string;
}

export interface OptionLabel {
  key: string;
  label: string;
}

export interface SurveyResponse {
  answer?: SurveyAnswer;
  buttonLabels?: ButtonLabel[];
  optionLabels?: OptionLabel[];
  questionId: string;
  questionText: string;
}

export type FormState = {
  bloodConsent?: ConsentInfo;
  completedSurvey: boolean;
  consent?: ConsentInfo;
  parentConsent?: ConsentInfo;
  formId?: string;
  timestamp?: number;
  name?: string;
  email?: string;
  responses: SurveyResponse[];
  samples?: Sample[];
};

const initialState: FormState = {
  completedSurvey: false,
  responses: [],
};

export default function reducer(state = initialState, action: FormAction) {
  if (action.type === "START_FORM") {
    // Resets all form data
    return {
      ...initialState,
      formId: uuidv4(),
      timestamp: new Date().getTime(),
    };
  }
  if (action.type === "COMPLETE_SURVEY") {
    return { ...state, completedSurvey: true };
  }
  if (action.type === "CLEAR_FORM") {
    return initialState;
  }
  if (action.type === "SET_NAME") {
    return { ...state, name: action.name, timestamp: new Date().getTime() };
  }
  if (action.type === "SET_EMAIL") {
    return { ...state, email: action.email, timestamp: new Date().getTime() };
  }
  if (action.type === "SET_CONSENT") {
    return {
      ...state,
      consent: action.consent,
      timestamp: new Date().getTime(),
    };
  }
  if (action.type === "SET_PARENT_CONSENT") {
    return {
      ...state,
      parentConsent: action.consent,
      timestamp: new Date().getTime(),
    };
  }
  if (action.type === "SET_BLOOD_CONSENT") {
    return {
      ...state,
      bloodConsent: action.consent,
      timestamp: new Date().getTime(),
    };
  }
  if (action.type === "SET_SAMPLES") {
    return {
      ...state,
      samples: action.samples,
      timestamp: new Date().getTime(),
    };
  }
  if (action.type === "SET_RESPONSES") {
    return {
      ...state,
      responses: action.responses,
      timestamp: new Date().getTime(),
    };
  }
  return state;
}

export function startForm(): FormAction {
  return {
    type: "START_FORM",
  };
}

export function clearForm(): FormAction {
  return {
    type: "CLEAR_FORM",
  };
}

export function completeSurvey(): FormAction {
  return {
    type: "COMPLETE_SURVEY",
  };
}

export function setName(name: string): FormAction {
  return {
    type: "SET_NAME",
    name,
  };
}

export function setEmail(email: string): FormAction {
  return {
    type: "SET_EMAIL",
    email,
  };
}

export function setConsent(consent: ConsentInfo): FormAction {
  return {
    type: "SET_CONSENT",
    consent,
  };
}

export function setParentConsent(consent: ConsentInfo): FormAction {
  return {
    type: "SET_PARENT_CONSENT",
    consent,
  };
}

export function setBloodConsent(consent: ConsentInfo): FormAction {
  return {
    type: "SET_BLOOD_CONSENT",
    consent,
  };
}

export function setSamples(samples: Sample[]): FormAction {
  return {
    type: "SET_SAMPLES",
    samples,
  };
}

export function setResponses(responses: SurveyResponse[]): FormAction {
  return {
    type: "SET_RESPONSES",
    responses,
  };
}
