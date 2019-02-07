import uuidv4 from "uuid/v4";
import {
  ConsentInfo,
  EventInfo,
  EventInfoKind,
} from "audere-lib/feverProtocol";

import { SurveyResponse } from "./types";

export type ScreeningAction =
  | { type: "START_SCREENING" }
  | { type: "SET_COMPLETE"; complete: boolean }
  | { type: "SET_CONSENT"; consent: ConsentInfo }
  | { type: "SET_NAME"; name: string }
  | { type: "SET_EMAIL"; email: string }
  | { type: "APPEND_EVENT"; kind: EventInfoKind; refId: string }
  | { type: "SET_RESPONSES"; responses: SurveyResponse[] };

export type ScreeningState = {
  complete: boolean;
  consent?: ConsentInfo;
  email?: string;
  events: EventInfo[];
  id?: string;
  name?: string;
  responses: SurveyResponse[];
  timestamp?: number;
};

const initialState: ScreeningState = {
  complete: false,
  events: [],
  responses: [],
};

export default function reducer(state = initialState, action: ScreeningAction) {
  if (action.type === "START_SCREENING") {
    // Resets all screening data
    return {
      ...initialState,
      events: pushEvent(
        initialState,
        EventInfoKind.Screening,
        "StartedScreening"
      ),
      id: uuidv4(),
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

  if (action.type === "SET_COMPLETE") {
    return {
      ...state,
      complete: action.complete,
      timestamp: new Date().getTime(),
    };
  }

  return state;
}

export function startScreening(): ScreeningAction {
  return {
    type: "START_SCREENING",
  };
}

export function setName(name: string): ScreeningAction {
  return {
    type: "SET_NAME",
    name,
  };
}

export function setEmail(email: string): ScreeningAction {
  return {
    type: "SET_EMAIL",
    email,
  };
}

export function setConsent(consent: ConsentInfo): ScreeningAction {
  return {
    type: "SET_CONSENT",
    consent,
  };
}

export function appendScreeningEvent(
  kind: EventInfoKind,
  refId: string
): ScreeningAction {
  return {
    type: "APPEND_EVENT",
    kind,
    refId,
  };
}

export function setScreeningResponses(
  responses: SurveyResponse[]
): ScreeningAction {
  return {
    type: "SET_RESPONSES",
    responses,
  };
}

export function setScreeningComplete(complete: boolean): ScreeningAction {
  return {
    type: "SET_COMPLETE",
    complete,
  };
}

function pushEvent(state: ScreeningState, kind: EventInfoKind, refId: string) {
  let newEvents = state.events.slice(0);
  newEvents.push({
    kind,
    at: new Date().toISOString(),
    refId,
  });
  return newEvents;
}
