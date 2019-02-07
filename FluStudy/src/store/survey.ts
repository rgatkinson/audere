import uuidv4 from "uuid/v4";
import { SampleInfo, EventInfo, EventInfoKind } from "audere-lib/feverProtocol";
import { SurveyResponse } from "./types";

export type SurveyAction =
  | { type: "START_SURVEY" }
  | { type: "SET_COMPLETE"; complete: boolean }
  | { type: "SET_EMAIL"; email: string }
  | { type: "SET_SAMPLES"; samples: SampleInfo[] }
  | { type: "APPEND_EVENT"; kind: EventInfoKind; refId: string }
  | { type: "SET_RESPONSES"; responses: SurveyResponse[] };

export type SurveyState = {
  complete: boolean;
  email?: string;
  events: EventInfo[];
  id?: string;
  responses: SurveyResponse[];
  samples?: SampleInfo[];
  timestamp?: number;
};

const initialState: SurveyState = {
  complete: false,
  events: [],
  responses: [],
};

export default function reducer(state = initialState, action: SurveyAction) {
  if (action.type === "START_SURVEY") {
    // Resets all survey data
    return {
      ...initialState,
      events: pushEvent(initialState, EventInfoKind.Survey, "StartedSurvey"),
      id: uuidv4(),
      timestamp: new Date().getTime(),
    };
  }
  if (action.type === "SET_EMAIL") {
    return { ...state, email: action.email, timestamp: new Date().getTime() };
  }
  if (action.type === "APPEND_EVENT") {
    return {
      ...state,
      events: pushEvent(state, action.kind, action.refId),
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
  if (action.type === "SET_COMPLETE") {
    return {
      ...state,
      complete: action.complete,
      timestamp: new Date().getTime(),
    };
  }

  return state;
}

export function startSurvey(): SurveyAction {
  return {
    type: "START_SURVEY",
  };
}

export function setSurveyEmail(email: string): SurveyAction {
  return {
    type: "SET_EMAIL",
    email,
  };
}

export function appendSurveyEvent(
  kind: EventInfoKind,
  refId: string
): SurveyAction {
  return {
    type: "APPEND_EVENT",
    kind,
    refId,
  };
}

export function setSurveyResponses(responses: SurveyResponse[]): SurveyAction {
  return {
    type: "SET_RESPONSES",
    responses,
  };
}

export function setSamples(samples: SampleInfo[]): SurveyAction {
  return {
    type: "SET_SAMPLES",
    samples,
  };
}

export function setSurveyComplete(complete: boolean): SurveyAction {
  return {
    type: "SET_COMPLETE",
    complete,
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
