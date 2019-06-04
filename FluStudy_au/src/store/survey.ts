// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import uuidv4 from "uuid/v4";
import { format } from "date-fns";
import {
  EventInfo,
  EventInfoKind,
  NonPIIConsentInfo,
  PushNotificationState,
  SampleInfo,
  WorkflowInfo,
} from "audere-lib/coughProtocol";
import { SurveyResponse } from "./types";
import { onCSRUIDEstablished } from "../util/tracker";
import { DEVICE_INFO, ios } from "../transport/DeviceInfo";
import i18n from "i18next";

export type SurveyAction =
  | { type: "APPEND_EVENT"; kind: EventInfoKind; event: string }
  | { type: "APPEND_INVALID_BARCODE"; barcode: SampleInfo }
  | { type: "SET_CONSENT"; consent: NonPIIConsentInfo }
  | { type: "SET_KIT_BARCODE"; kitBarcode: SampleInfo }
  | { type: "SET_TEST_STRIP_IMG"; testStripImg: SampleInfo }
  | { type: "SET_ONE_MINUTE_START_TIME" }
  | { type: "SET_TEN_MINUTE_START_TIME" }
  | { type: "SET_PUSH_STATE"; pushState: PushNotificationState }
  | { type: "SET_RESPONSES"; responses: SurveyResponse[] }
  | { type: "SET_WORKFLOW"; workflow: WorkflowInfo }
  | { type: "SET_CSRUID_IF_UNSET"; csruid: string }
  | { type: "SET_PHOTO"; photoUri: string }
  | { type: "SET_RDT_PHOTO"; rdtPhotoUri: string }
  | { type: "SET_SUPPORT_CODE"; supportCode: string };

export type SurveyState = {
  consent?: NonPIIConsentInfo;
  csruid?: string;
  email?: string;
  events: EventInfo[];
  invalidBarcodes?: SampleInfo[];
  kitBarcode?: SampleInfo;
  oneMinuteStartTime?: number;
  photoUri?: string;
  pushState: PushNotificationState;
  rdtPhotoUri?: string;
  responses: SurveyResponse[];
  supportCode?: string;
  tenMinuteStartTime?: number;
  testStripImg?: SampleInfo;
  timestamp?: number;
  workflow: WorkflowInfo;
  [key: string]:
    | boolean
    | NonPIIConsentInfo
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

    case "SET_CONSENT":
      return {
        ...state,
        consent: action.consent,
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

    case "SET_TEN_MINUTE_START_TIME":
      if (state.tenMinuteStartTime == null) {
        return {
          ...state,
          tenMinuteStartTime: new Date().getTime(),
          timestamp: new Date().getTime(),
        };
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

    case "SET_RESPONSES":
      return {
        ...state,
        responses: action.responses,
        timestamp: new Date().getTime(),
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

    case "SET_SUPPORT_CODE":
      return {
        ...state,
        supportCode: action.supportCode,
      };

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

export function setConsent(): SurveyAction {
  return {
    type: "SET_CONSENT",
    consent: {
      terms:
        i18n.t("Consent:consentFormHeader1") +
        "\n" +
        i18n.t("Consent:consentFormHeader2") +
        "\n" +
        i18n.t("Consent:consentFormText"),
      date: format(new Date(), "YYYY-MM-DD"),
    },
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
