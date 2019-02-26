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
  | { type: "SET_TEST_STRIP_IMG"; testStripImg: SampleInfo }
  | { type: "SET_TEN_MINUTE_START_TIME" }
  | { type: "SET_PUSH_STATE"; pushState: PushNotificationState }
  | { type: "SET_RESPONSES"; responses: SurveyResponse[] }
  | { type: "SET_WORKFLOW"; workflow: WorkflowInfo }
  | { type: "SET_CSRUID_IF_UNSET"; csruid: string };

export type SurveyState = {
  consent?: ConsentInfo;
  email?: string;
  events: EventInfo[];
  csruid?: string;
  kitBarcode?: SampleInfo;
  testStripImg?: SampleInfo;
  pushState: PushNotificationState;
  responses: SurveyResponse[];
  tenMinuteStartTime?: number;
  timestamp?: number;
  workflow: WorkflowInfo;
};

const initialState: SurveyState = {
  events: [],
  responses: [],
  pushState: {
    showedSystemPrompt: false,
  },
  workflow: {
    screeningComplete: false,
    surveyComplete: false,
    surveyStarted: false,
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
  if (action.type === "SET_TEST_STRIP_IMG") {
    return {
      ...state,
      testStripImg: action.testStripImg,
      timestamp: new Date().getTime(),
    };
  }
  if (action.type === "SET_TEN_MINUTE_START_TIME") {
    return {
      ...state,
      tenMinuteStartTime: new Date().getTime(),
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
  if (action.type === "SET_WORKFLOW") {
    return {
      ...state,
      workflow: action.workflow,
      timestamp: new Date().getTime(),
    };
  }
  if (action.type === "SET_CSRUID_IF_UNSET") {
    if (state.csruid == null) {
      return {
        ...state,
        csruid: action.csruid,
      };
    }
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

export function setTestStripImg(testStripImg: SampleInfo): SurveyAction {
  return {
    type: "SET_TEST_STRIP_IMG",
    testStripImg,
  };
}

export function setTenMinuteStartTime(): SurveyAction {
  return {
    type: "SET_TEN_MINUTE_START_TIME",
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

export function setWorkflow(workflow: WorkflowInfo): SurveyAction {
  return {
    type: "SET_WORKFLOW",
    workflow,
  };
}

export function setCSRUIDIfUnset(csruid: string): SurveyAction {
  return {
    type: "SET_CSRUID_IF_UNSET",
    csruid,
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
