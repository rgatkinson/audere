// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { format } from "date-fns";
import {
  EventInfo,
  EventInfoKind,
  NonPIIConsentInfo,
  PushNotificationState,
  RDTInfo,
  RDTReaderResult,
  SampleInfo,
  WorkflowInfo,
} from "audere-lib/coughProtocol";
import {
  ButtonLabel,
  OptionLabel,
  SurveyAnswer,
  SurveyResponse,
} from "./types";
import { OptionQuestion, SurveyQuestion } from "audere-lib/coughQuestionConfig";
import { onCSRUIDEstablished } from "../util/tracker";
import i18n from "i18next";

export type SurveyAction =
  | { type: "APPEND_EVENT"; kind: EventInfoKind; event: string }
  | { type: "APPEND_INVALID_BARCODE"; barcode: SampleInfo }
  | { type: "SET_CONSENT"; consent: NonPIIConsentInfo }
  | { type: "SET_KIT_BARCODE"; kitBarcode: SampleInfo }
  | { type: "SET_TEST_STRIP_IMG"; testStripImg: SampleInfo }
  | { type: "SET_ONE_MINUTE_START_TIME" }
  | { type: "SET_TEN_MINUTE_START_TIME" }
  | { type: "SET_TOTAL_TEST_STRIP_TIME" }
  | { type: "SET_PUSH_STATE"; pushState: PushNotificationState }
  | { type: "SET_RESPONSES"; responses: SurveyResponse[] }
  | { type: "SET_WORKFLOW"; workflow: WorkflowInfo }
  | { type: "SET_CSRUID_IF_UNSET"; csruid: string }
  | { type: "SET_PHOTO"; photoUri: string }
  | { type: "SET_RDT_PHOTO"; rdtPhotoUri: string }
  | { type: "SET_RDT_READER_RESULT"; rdtReaderResult: RDTReaderResult }
  | {
      type: "UPDATE_RESPONSES";
      answer: SurveyAnswer;
      question: OptionQuestion | SurveyQuestion;
    };

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
  rdtInfo?: RDTInfo;
  responses: SurveyResponse[];
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
    | RDTInfo
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

    case "SET_RDT_READER_RESULT":
      return {
        ...state,
        rdtInfo: { ...state.rdtInfo, rdtReaderResult: action.rdtReaderResult },
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

    case "UPDATE_RESPONSES":
      return {
        ...state,
        responses: updateResponses(state, action.answer, action.question),
        timestamp: new Date().getTime(),
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
        i18n.t("Consent:consentFormText") +
        "\n" +
        i18n.t("surveyTitle:researchByTheseResearchers") +
        "\n" +
        i18n.t("surveyTitle:researchByAnyResearchers") +
        "\n" +
        i18n.t("Consent:consentFormText2"),
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

export function setTotalTestStripTime(): SurveyAction {
  return {
    type: "SET_TOTAL_TEST_STRIP_TIME",
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

export function setRDTReaderResult(
  rdtReaderResult: RDTReaderResult
): SurveyAction {
  return {
    type: "SET_RDT_READER_RESULT",
    rdtReaderResult,
  };
}

export function updateAnswer(
  answer: SurveyAnswer,
  question: SurveyQuestion
): SurveyAction {
  return {
    type: "UPDATE_RESPONSES",
    answer,
    question,
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

function initializeResponse(
  data: OptionQuestion | SurveyQuestion
): SurveyResponse {
  const buttonLabels: ButtonLabel[] = [];
  data.buttons.forEach(button => {
    buttonLabels.push({
      key: button.key,
      label: i18n.t("surveyButton:" + button.key),
    });
  });

  const optionLabels: OptionLabel[] = [];
  if (data.type === "optionQuestion") {
    const optionQuestion = data as OptionQuestion;
    optionQuestion.options.forEach((option: string) => {
      optionLabels.push({
        key: option,
        label: i18n.t("surveyOption:" + option),
      });
    });
  }

  return {
    answer: {},
    buttonLabels,
    optionLabels,
    questionId: data.id,
    questionText: (
      (data.title ? i18n.t("surveyTitle:" + data.title) : "") +
      " " +
      (data.description ? i18n.t("surveyDescription:" + data.description) : "")
    ).trim(),
  };
}

function updateResponses(
  state: SurveyState,
  answer: SurveyAnswer,
  question: SurveyQuestion
) {
  const responses = state.responses.slice(0);
  let response = responses.find(
    response => response.questionId === question.id
  );
  if (response == null) {
    response = initializeResponse(question);
    responses.push(response);
  }
  response.answer = { ...response.answer, ...answer };
  return responses;
}
