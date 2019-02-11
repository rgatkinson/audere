import uuidv4 from "uuid/v4";
import {
  ConsentInfo,
  EventInfo,
  EventInfoKind,
  SampleInfo,
  PushNotificationState,
  PushRegistrationError,
  WorkflowInfo,
} from "audere-lib/feverProtocol";
import { SurveyResponse } from "./types";

export type SurveyAction =
  | { type: "APPEND_EVENT"; kind: EventInfoKind; event: string }
  | { type: "SET_CONSENT"; consent: ConsentInfo }
  | { type: "SET_EMAIL"; email: string }
  | { type: "SET_KIT_BARCODE"; kitBarcode: SampleInfo }
  | { type: "SET_PUSH_STATE"; pushState: PushNotificationState }
  | { type: "SET_RESPONSES"; responses: SurveyResponse[] };

export type SurveyState = {
  consent?: ConsentInfo;
  email?: string;
  events: EventInfo[];
  id?: string;
  kitBarcode?: SampleInfo;
  pushState: PushNotificationState;
  responses: SurveyResponse[];
  timestamp?: number;
  workflow: WorkflowInfo;
};

const initialState: SurveyState = {
  events: [],
  id: uuidv4(),
  responses: [],
  pushState: {
    showedSystemPrompt: false,
  },
  workflow: {
    screeningComplete: false,
    surveyComplete: false,
  },
};

export default function reducer(state = initialState, action: SurveyAction) {
  if (action.type === "APPEND_EVENT") {
    return {
      ...state,
      events: pushEvent(state, action.kind, action.event),
      timestamp: new Date().getTime(),
    };
  }
  if (action.type === "SET_CONSENT") {
    return {
      ...state,
      consent: action.consent,
      timestamp: new Date().getTime(),
    };
  }
  if (action.type === "SET_EMAIL") {
    return { ...state, email: action.email, timestamp: new Date().getTime() };
  }
  if (action.type === "SET_KIT_BARCODE") {
    return {
      ...state,
      kitBarcode: action.kitBarcode,
      timestamp: new Date().getTime(),
    };
  }
  if (action.type === "SET_PUSH_STATE") {
    return {
      ...state,
      pushState: action.pushState,
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

export function appendEvent(kind: EventInfoKind, event: string): SurveyAction {
  return {
    type: "APPEND_EVENT",
    kind,
    event,
  };
}

export function setConsent(consent: ConsentInfo): SurveyAction {
  return {
    type: "SET_CONSENT",
    consent,
  };
}

export function setEmail(email: string): SurveyAction {
  return {
    type: "SET_EMAIL",
    email,
  };
}

export function setKitBarcode(kitBarcode: SampleInfo): SurveyAction {
  return {
    type: "SET_KIT_BARCODE",
    kitBarcode,
  };
}

export function setPushNotificationState(
  pushState: PushNotificationState
): SurveyAction {
  return {
    type: "SET_PUSH_STATE",
    pushState,
  };
}

export function setResponses(responses: SurveyResponse[]): SurveyAction {
  return {
    type: "SET_RESPONSES",
    responses,
  };
}

function pushEvent(state: SurveyState, kind: EventInfoKind, refId: string) {
  let newEvents = state.events.slice(0);
  newEvents.push({
    kind,
    at: new Date().toISOString(),
    refId,
  });
  return newEvents;
}
