import uuidv4 from "uuid/v4";

import {
  ConsentInfo,
  GiftCardInfo,
  EventInfo,
  EventInfoKind,
} from "audere-lib";
import { ENETRESET } from "constants";

export type FormAction =
  | { type: "START_FORM"; admin: string; location: string; isDemo: boolean }
  | { type: "COMPLETE_SURVEY" }
  | { type: "CLEAR_FORM" }
  | { type: "CLEAR_CONSENTS" }
  | { type: "SET_PARENT_CONSENT"; consent: ConsentInfo }
  | { type: "SET_CONSENT"; consent: ConsentInfo }
  | { type: "SET_ASSENT"; consent: ConsentInfo }
  | { type: "SET_BLOOD_CONSENT"; consent: ConsentInfo }
  | { type: "SET_HIPAA_CONSENT"; consent: ConsentInfo }
  | { type: "SET_HIPAA_RESEARCHER_CONSENT"; consent: ConsentInfo }
  | { type: "SET_NAME"; name: string }
  | { type: "SET_EMAIL"; email: string }
  | { type: "SET_SAMPLES"; samples: Sample[] }
  | { type: "SET_GIFTCARDS"; giftcards: GiftCardInfo[] }
  | { type: "SET_EVENTS"; events: EventInfo[] }
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
  admin?: string;
  assent?: ConsentInfo;
  bloodConsent?: ConsentInfo;
  hipaaConsent?: ConsentInfo;
  hipaaResearcherConsent?: ConsentInfo;
  completedSurvey: boolean;
  consent?: ConsentInfo;
  location?: string;
  parentConsent?: ConsentInfo;
  formId?: string;
  timestamp?: number;
  name?: string;
  email?: string;
  responses: SurveyResponse[];
  samples?: Sample[];
  events?: EventInfo[];
  giftcards?: GiftCardInfo[];
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
      admin: action.admin,
      location: action.location,
      formId: uuidv4(),
      isDemo: action.isDemo,
      events: [
        {
          kind: EventInfoKind.Visit,
          at: new Date().toISOString(),
          refId: "STARTED_FORM",
        },
      ],
      timestamp: new Date().getTime(),
    };
  }
  if (action.type === "COMPLETE_SURVEY") {
    let events = !!state.events ? state.events.slice(0) : [];
    events.push({
      kind: EventInfoKind.Visit,
      at: new Date().toISOString(),
      refId: "COMPLETED_FORM",
    });
    return { ...state, events: events, completedSurvey: true };
  }
  if (action.type === "CLEAR_FORM") {
    return initialState;
  }
  if (action.type === "CLEAR_CONSENTS") {
    let newState = Object.assign({}, state);
    delete newState.assent;
    delete newState.bloodConsent;
    delete newState.consent;
    delete newState.hipaaConsent;
    delete newState.parentConsent;
    return newState;
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
  if (action.type === "SET_ASSENT") {
    return {
      ...state,
      assent: action.consent,
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
  if (action.type === "SET_HIPAA_CONSENT") {
    return {
      ...state,
      hipaaConsent: action.consent,
      timestamp: new Date().getTime(),
    };
  }
  if (action.type === "SET_HIPAA_RESEARCHER_CONSENT") {
    return {
      ...state,
      hipaaResearcherConsent: action.consent,
      timestamp: new Date().getTime(),
    };
  }
  if (action.type === "SET_SAMPLES") {
    let events = !!state.events ? state.events.slice(0) : [];
    events.push({
      kind: EventInfoKind.Sample,
      at: new Date().toISOString(),
      refId: "SCANNED",
    });
    return {
      ...state,
      samples: action.samples,
      events: events,
      timestamp: new Date().getTime(),
    };
  }
  if (action.type === "SET_GIFTCARDS") {
    let events = !!state.events ? state.events.slice(0) : [];
    events.push({
      kind: EventInfoKind.Visit,
      at: new Date().toISOString(),
      refId: "GIFTCARD_SCANNED",
    });
    return {
      ...state,
      giftcards: action.giftcards,
      events: events,
      timestamp: new Date().getTime(),
    };
  }
  if (action.type === "SET_EVENTS") {
    return {
      ...state,
      events: action.events,
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

export function startForm(
  admin: string,
  location: string,
  isDemo: boolean
): FormAction {
  return {
    type: "START_FORM",
    admin,
    location,
    isDemo,
  };
}

export function clearForm(): FormAction {
  return {
    type: "CLEAR_FORM",
  };
}

export function clearConsents(): FormAction {
  return {
    type: "CLEAR_CONSENTS",
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

export function setAssent(consent: ConsentInfo): FormAction {
  return {
    type: "SET_ASSENT",
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

export function setHipaaConsent(consent: ConsentInfo): FormAction {
  return {
    type: "SET_HIPAA_CONSENT",
    consent,
  };
}

export function setHipaaResearcherConsent(consent: ConsentInfo): FormAction {
  return {
    type: "SET_HIPAA_RESEARCHER_CONSENT",
    consent,
  };
}

export function setSamples(samples: Sample[]): FormAction {
  return {
    type: "SET_SAMPLES",
    samples,
  };
}

export function setGiftcards(giftcards: GiftCardInfo[]): FormAction {
  return {
    type: "SET_GIFTCARDS",
    giftcards,
  };
}

export function setEvents(events: EventInfo[]): FormAction {
  return {
    type: "SET_EVENTS",
    events,
  };
}

export function setResponses(responses: SurveyResponse[]): FormAction {
  return {
    type: "SET_RESPONSES",
    responses,
  };
}
