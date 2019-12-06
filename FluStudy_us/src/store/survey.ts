// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  EventInfo,
  EventInfoKind,
  PushNotificationState,
  RDTInfo,
  RDTReaderResult,
  SampleInfo,
  WorkflowInfo,
} from "audere-lib/chillsProtocol";
import { onCSRUIDEstablished } from "../util/tracker";

export type SurveyAction =
  | { type: "APPEND_EVENT"; kind: EventInfoKind; event: string }
  | { type: "APPEND_INVALID_BARCODE"; barcode: SampleInfo }
  | { type: "SET_KIT_BARCODE"; kitBarcode: SampleInfo }
  | {
      type: "SET_TEST_STRIP_IMG";
      testStripImg: SampleInfo;
      testStripHCImg?: SampleInfo;
    }
  | { type: "SET_ONE_MINUTE_START_TIME" }
  | { type: "SET_ONE_MINUTE_TIMER_DONE" }
  | { type: "SET_TEN_MINUTE_START_TIME" }
  | { type: "SET_TEN_MINUTE_TIMER_DONE" }
  | { type: "SET_TOTAL_TEST_STRIP_TIME" }
  | { type: "SET_RDT_START_TIME" }
  | { type: "SET_RDT_CAPTURE_TIME"; successfulCapture: boolean }
  | { type: "SET_PUSH_STATE"; pushState: PushNotificationState }
  | { type: "SET_WORKFLOW"; workflow: WorkflowInfo }
  | { type: "SET_CSRUID_IF_UNSET"; csruid: string }
  | { type: "SET_PHOTO"; photoUri: string }
  | { type: "SET_RDT_PHOTO"; rdtPhotoUri: string }
  | { type: "SET_RDT_PHOTOHC"; rdtPhotoHCUri: string }
  | { type: "SET_RDT_READER_RESULT"; rdtReaderResult: RDTReaderResult }
  | {
      type: "SET_RDT_CAPTURE_INFO";
      flashEnabled: boolean;
      legacyCameraApi: boolean;
    };

export type SurveyState = {
  csruid?: string;
  email?: string;
  events: EventInfo[];
  invalidBarcodes?: SampleInfo[];
  kitBarcode?: SampleInfo;
  oneMinuteStartTime?: number;
  oneMinuteTimerDone?: boolean;
  photoUri?: string;
  pushState: PushNotificationState;
  rdtPhotoUri?: string;
  rdtPhotoHCUri?: string;
  rdtInfo?: RDTInfo;
  tenMinuteStartTime?: number;
  tenMinuteTimerDone?: boolean;
  testStripImg?: SampleInfo;
  testStripHCImg?: SampleInfo;
  timestamp?: number;
  workflow: WorkflowInfo;
  [key: string]:
    | boolean
    | string
    | EventInfo[]
    | SampleInfo[]
    | SampleInfo
    | PushNotificationState
    | RDTInfo
    | number
    | WorkflowInfo
    | undefined;
};

let rdtStartTime: number | undefined;
let rdtTotalTime: number = 0;

const initialState: SurveyState = {
  events: [],
  pushState: {
    showedSystemPrompt: false,
  },
  workflow: {},
};

export default function reducer(state = initialState, action: SurveyAction) {
  switch (action.type) {
    case "APPEND_EVENT":
      return {
        ...state,
        events: pushEvent(state, action.kind, action.event),
        timestamp: new Date().getTime(),
      };

    case "APPEND_INVALID_BARCODE":
      return {
        ...state,
        invalidBarcodes: pushInvalidBarcode(state, action.barcode),
        timestamp: new Date().getTime(),
      };

    case "SET_KIT_BARCODE":
      return {
        ...state,
        kitBarcode: action.kitBarcode,
        timestamp: new Date().getTime(),
      };

    case "SET_TEST_STRIP_IMG":
      return {
        ...state,
        testStripImg: action.testStripImg,
        testStripHCImg: action.testStripHCImg,
        timestamp: new Date().getTime(),
      };

    case "SET_ONE_MINUTE_START_TIME":
      if (state.oneMinuteStartTime == null) {
        return {
          ...state,
          oneMinuteStartTime: new Date().getTime(),
          timestamp: new Date().getTime(),
        };
      }
      return state;

    case "SET_ONE_MINUTE_TIMER_DONE":
      if (!state.oneMinuteTimerDone) {
        return {
          ...state,
          oneMinuteTimerDone: true,
          timestamp: new Date().getTime(),
        };
      }
      return state;

    case "SET_TEN_MINUTE_START_TIME":
      if (state.tenMinuteStartTime == null) {
        return {
          ...state,
          tenMinuteStartTime: new Date().getTime(),
          timestamp: new Date().getTime(),
        };
      }
      return state;

    case "SET_TEN_MINUTE_TIMER_DONE":
      if (!state.tenMinuteTimerDone) {
        return {
          ...state,
          tenMinuteTimerDone: true,
          timestamp: new Date().getTime(),
        };
      }
      return state;

    case "SET_TOTAL_TEST_STRIP_TIME":
      // We only write the total test strip time the first time around.  If you
      // back up and retraverse the screens, we don't update the total time.
      if (
        state.tenMinuteStartTime &&
        !(state.rdtInfo && state.rdtInfo.totalTestStripTime)
      ) {
        const timeNow = new Date().getTime();
        const deltaMS = timeNow - state.tenMinuteStartTime;

        return {
          ...state,
          rdtInfo: { ...state.rdtInfo, totalTestStripTime: deltaMS },
          timestamp: timeNow,
        };
      }
      return state;

    case "SET_RDT_START_TIME":
      // We reset capture time each time the RDT reader is visited.
      rdtStartTime = new Date().getTime();
      return state;

    case "SET_RDT_CAPTURE_TIME":
      if (rdtStartTime) {
        const timeNow = new Date().getTime();
        const deltaMS = timeNow - rdtStartTime;
        rdtTotalTime += deltaMS;
        if (action.successfulCapture) {
          return {
            ...state,
            rdtInfo: {
              ...state.rdtInfo,
              captureTime: deltaMS,
              rdtTotalTime: rdtTotalTime,
            },
            timestamp: timeNow,
          };
        } else {
          return {
            ...state,
            rdtInfo: { ...state.rdtInfo, rdtTotalTime: rdtTotalTime },
            timestamp: timeNow,
          };
        }
      }
      return state;

    case "SET_PHOTO":
      return {
        ...state,
        photoUri: action.photoUri,
        timestamp: new Date().getTime(),
      };

    case "SET_PUSH_STATE":
      return {
        ...state,
        pushState: action.pushState,
        timestamp: new Date().getTime(),
      };

    case "SET_RDT_PHOTO":
      return {
        ...state,
        rdtPhotoUri: action.rdtPhotoUri,
        timestamp: new Date().getTime(),
      };

    case "SET_RDT_PHOTOHC":
      return {
        ...state,
        rdtPhotoHCUri: action.rdtPhotoHCUri,
        timestamp: new Date().getTime(),
      };

    case "SET_RDT_READER_RESULT":
      return {
        ...state,
        rdtInfo: { ...state.rdtInfo, rdtReaderResult: action.rdtReaderResult },
        timestamp: new Date().getTime(),
      };

    case "SET_RDT_CAPTURE_INFO":
      return {
        ...state,
        rdtInfo: {
          ...state.rdtInfo,
          flashEnabled: action.flashEnabled,
          legacyCameraApi: action.legacyCameraApi,
        },
      };

    case "SET_WORKFLOW":
      return {
        ...state,
        workflow: action.workflow,
        timestamp: new Date().getTime(),
      };

    case "SET_CSRUID_IF_UNSET":
      if (state.csruid == null) {
        return {
          ...state,
          csruid: action.csruid,
        };
      }
      return state;

    default:
      return state;
  }
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

export function setKitBarcode(kitBarcode: SampleInfo): SurveyAction {
  return {
    type: "SET_KIT_BARCODE",
    kitBarcode,
  };
}

export function setTestStripImg(
  testStripImg: SampleInfo,
  testStripHCImg?: SampleInfo
): SurveyAction {
  return {
    type: "SET_TEST_STRIP_IMG",
    testStripImg,
    testStripHCImg,
  };
}

export function setOneMinuteStartTime(): SurveyAction {
  return {
    type: "SET_ONE_MINUTE_START_TIME",
  };
}

export function setOneMinuteTimerDone(): SurveyAction {
  return {
    type: "SET_ONE_MINUTE_TIMER_DONE",
  };
}

export function setTenMinuteStartTime(): SurveyAction {
  return {
    type: "SET_TEN_MINUTE_START_TIME",
  };
}

export function setTenMinuteTimerDone(): SurveyAction {
  return {
    type: "SET_TEN_MINUTE_TIMER_DONE",
  };
}

export function setTotalTestStripTime(): SurveyAction {
  return {
    type: "SET_TOTAL_TEST_STRIP_TIME",
  };
}

export function setRDTStartTime(): SurveyAction {
  return {
    type: "SET_RDT_START_TIME",
  };
}

export function setRDTCaptureTime(successfulCapture: boolean): SurveyAction {
  return {
    type: "SET_RDT_CAPTURE_TIME",
    successfulCapture,
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

export function setPhoto(photoUri: string): SurveyAction {
  return {
    type: "SET_PHOTO",
    photoUri,
  };
}

export function setRDTPhoto(rdtPhotoUri: string): SurveyAction {
  return {
    type: "SET_RDT_PHOTO",
    rdtPhotoUri,
  };
}

export function setRDTPhotoHC(rdtPhotoHCUri: string): SurveyAction {
  return {
    type: "SET_RDT_PHOTOHC",
    rdtPhotoHCUri,
  };
}

export function setRDTReaderResult(
  rdtReaderResult: RDTReaderResult
): SurveyAction {
  return {
    type: "SET_RDT_READER_RESULT",
    rdtReaderResult,
  };
}

export function setRDTCaptureInfo(
  flashEnabled: boolean,
  legacyCameraApi: boolean
): SurveyAction {
  return {
    type: "SET_RDT_CAPTURE_INFO",
    flashEnabled,
    legacyCameraApi,
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
