// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

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
import { onCSRUIDEstablished } from "../util/tracker";

export type SurveyAction =
  | { type: "APPEND_EVENT"; kind: EventInfoKind; event: string }
  | { type: "APPEND_INVALID_BARCODE"; barcode: SampleInfo }
  | { type: "SET_CONSENT"; consent: ConsentInfo }
  | { type: "SET_EMAIL"; email: string }
  | { type: "SET_KIT_BARCODE"; kitBarcode: SampleInfo }
  | { type: "SET_TEST_STRIP_IMG"; testStripImg: SampleInfo }
  | { type: "SET_ONE_MINUTE_START_TIME" }
  | { type: "SET_TEN_MINUTE_START_TIME" }
  | { type: "SET_PUSH_STATE"; pushState: PushNotificationState }
  | { type: "SET_RESPONSES"; responses: SurveyResponse[] }
  | { type: "SET_WORKFLOW"; workflow: WorkflowInfo }
  | { type: "SET_CSRUID_IF_UNSET"; csruid: string }
  | { type: "SET_RDT_PHOTO"; rdtPhotoUri: string }
  | { type: "SET_SUPPORT_CODE"; supportCode: string };

export type SurveyState = {
  consent?: ConsentInfo;
  email?: string;
  events: EventInfo[];
  csruid?: string;
  invalidBarcodes?: SampleInfo[];
  kitBarcode?: SampleInfo;
  testStripImg?: SampleInfo;
  pushState: PushNotificationState;
  rdtPhotoUri?: string;
  responses: SurveyResponse[];
  supportCode?: string;
  oneMinuteStartTime?: number;
  tenMinuteStartTime?: number;
  timestamp?: number;
  workflow: WorkflowInfo;
  [key: string]:
    | ConsentInfo
    | string
    | EventInfo[]
    | SampleInfo[]
    | SampleInfo
    | PushNotificationState
    | SurveyResponse[]
    | number
    | WorkflowInfo
    | undefined;
};

const initialState: SurveyState = {
  events: [],
  responses: [],
  pushState: {
    showedSystemPrompt: false,
  },
  workflow: {},
};

export default function reducer(state = initialState, action: SurveyAction) {
  if (action.type === "APPEND_EVENT") {
    return {
      ...state,
      events: pushEvent(state, action.kind, action.event),
      timestamp: new Date().getTime(),
    };
  }
  if (action.type === "APPEND_INVALID_BARCODE") {
    return {
      ...state,
      invalidBarcodes: pushInvalidBarcode(state, action.barcode),
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
  if (action.type === "SET_ONE_MINUTE_START_TIME") {
    if (state.oneMinuteStartTime == null) {
      return {
        ...state,
        oneMinuteStartTime: new Date().getTime(),
        timestamp: new Date().getTime(),
      };
    }
  }

  if (action.type === "SET_TEN_MINUTE_START_TIME") {
    if (state.tenMinuteStartTime == null) {
      return {
        ...state,
        tenMinuteStartTime: new Date().getTime(),
        timestamp: new Date().getTime(),
      };
    }
  }
  if (action.type === "SET_PUSH_STATE") {
    return {
      ...state,
      pushState: action.pushState,
      timestamp: new Date().getTime(),
    };
  }
  if (action.type === "SET_RDT_PHOTO") {
    return {
      ...state,
      rdtPhotoUri: action.rdtPhotoUri,
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
  if (action.type === "SET_SUPPORT_CODE") {
    return {
      ...state,
      supportCode: action.supportCode,
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

export function appendInvalidBarcode(barcode: SampleInfo): SurveyAction {
  return {
    type: "APPEND_INVALID_BARCODE",
    barcode,
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

export function setOneMinuteStartTime(): SurveyAction {
  return {
    type: "SET_ONE_MINUTE_START_TIME",
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
  onCSRUIDEstablished(csruid);
  return {
    type: "SET_CSRUID_IF_UNSET",
    csruid,
  };
}

export function setRDTPhoto(rdtPhotoUri: string): SurveyAction {
  return {
    type: "SET_RDT_PHOTO",
    rdtPhotoUri,
  };
}

export function setSupportCode(supportCode: string): SurveyAction {
  return {
    type: "SET_SUPPORT_CODE",
    supportCode,
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

function pushInvalidBarcode(state: SurveyState, barcode: SampleInfo) {
  let newInvalidBarcodes =
    state.invalidBarcodes == null ? [] : state.invalidBarcodes.slice(0);
  newInvalidBarcodes.push(barcode);
  return newInvalidBarcodes;
}
