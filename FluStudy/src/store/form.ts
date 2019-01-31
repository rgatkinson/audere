import uuidv4 from "uuid/v4";

import { ConsentInfo, EventInfo, EventInfoKind } from "audere-lib";

export type FormAction =
  | { type: "START_FORM" }
  | { type: "SET_CONSENT"; consent: ConsentInfo }
  | { type: "SET_NAME"; name: string }
  | { type: "SET_EMAIL"; email: string }
  | { type: "APPEND_EVENT"; kind: EventInfoKind; refId: string }
  | { type: "SET_RESPONSES"; responses: SurveyResponse[] };

export interface Address {
  name?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}

export interface Option {
  key: string;
  selected: boolean;
}

export interface ButtonLabel {
  key: string;
  label: string;
}

export interface OptionLabel {
  key: string;
  label: string;
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

export interface SurveyResponse {
  answer?: SurveyAnswer;
  buttonLabels?: ButtonLabel[];
  optionLabels?: OptionLabel[];
  questionId: string;
  questionText: string;
}

export type FormState = {
  consent?: ConsentInfo;
  email?: string;
  responses: SurveyResponse[];
  events: EventInfo[];
  name?: string;
  timestamp?: number;
};

const initialState: FormState = {
  responses: [],
  events: [],
};

export default function reducer(state = initialState, action: FormAction) {
  if (action.type === "START_FORM") {
    // Resets all form data
    return {
      ...initialState,
      events: pushEvent(initialState, EventInfoKind.Visit, "StartedForm"),
      timestamp: new Date().getTime(),
    };
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
  if (action.type === "APPEND_EVENT") {
    return {
      ...state,
      events: pushEvent(state, action.kind, action.refId),
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

export function appendEvent(kind: EventInfoKind, refId: string): FormAction {
  return {
    type: "APPEND_EVENT",
    kind,
    refId,
  };
}

export function setResponses(responses: SurveyResponse[]): FormAction {
  return {
    type: "SET_RESPONSES",
    responses,
  };
}

function pushEvent(state: FormState, kind: EventInfoKind, refId: string) {
  let newEvents = state.events.slice(0);
  newEvents.push({
    kind,
    at: new Date().toISOString(),
    refId,
  });
  return newEvents;
}
