// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { MiddlewareAPI, Dispatch, AnyAction } from "redux";
import { StoreState } from "./index";
import {
  HealthWorkerInfo,
  Message,
  EncounterInfo,
  EncounterTriageDocument,
} from "audere-lib/ebPhotoStoreProtocol";
import {
  syncEncounter,
  sendChatMessage,
  uploadToken,
  initializeMessageListener,
  initializeTriageListener,
  getCurrentUserId,
} from "./FirebaseStore";
import { setEvdStatus, setTriageNotes, receiveChatMessage } from "./patients";
import { retryUploads } from "../transport/photoUploader";

let unsubscribe: (() => void)[] = [];

// This is similar to the logger example at
// https://redux.js.org/api/applymiddleware

export function uploaderMiddleware({ getState, dispatch }: MiddlewareAPI) {
  return (next: Dispatch) => (action: AnyAction) => {
    const result = next(action);
    const state: StoreState = getState();
    let patientId: number | undefined;
    switch (action.type) {
      case "ADD_PATIENT":
      case "UPDATE_PATIENT":
        patientId = state.meta.currentPatient;
        if (patientId !== undefined) {
          if (action.type == "ADD_PATIENT") {
            const uuid = state.patients[patientId].uuid;
            initializeListeners(state, dispatch, uuid);
          }
          const encounterDocument = reduxToFirebase(state, patientId);
          syncEncounter(state.patients[patientId].uuid, encounterDocument);
        }
        break;
      case "VIEW_PATIENTS":
        retryUploads();
        break;
      case "SEND_MESSAGE":
        sendChatMessage(state.patients[action.patientId].uuid, action.message);
        break;
      case "persist/REHYDRATE":
        state.patients.forEach((patient, index) => {
          initializeListeners(state, dispatch, patient.uuid);
        });
        break;
      case "SET_FCM_TOKEN":
      case "LOGIN":
        if (state.meta.healthWorkerInfo && state.meta.fcmToken) {
          uploadToken(state.meta.healthWorkerInfo.phone, state.meta.fcmToken);
        }
        state.patients.forEach((patient, index) => {
          initializeListeners(state, dispatch, patient.uuid);
        });
        break;
      case "LOGOUT":
        destroyListeners();
        break;
    }
    return result;
  };
}

export function reduxToFirebase(
  state: StoreState,
  patientId: number
): EncounterInfo {
  const reduxPatient = state.patients[patientId];
  if (!state.meta.healthWorkerInfo) {
    throw Error("No community health worker data available");
  }
  const healthWorker: HealthWorkerInfo = {
    ...state.meta.healthWorkerInfo,
    notes: state.meta.healthWorkerInfo.notes || "",
  };
  return {
    isDemo: false,
    healthWorker,
    localIndex: reduxPatient.id.toString(),
    patient: reduxPatient.patientInfo,
    rdtPhotos: reduxPatient.photoInfo.map(
      localPhotoInfo => localPhotoInfo.photoInfo
    ),
    notes: reduxPatient.notes || "",
    updatedAt: reduxPatient.updatedAt,
  };
}

export function destroyListeners() {
  unsubscribe.forEach(fn => fn());
  unsubscribe = [];
}

export function initializeListeners(
  state: StoreState,
  dispatch: Dispatch,
  patientId: string
) {
  const uid = getCurrentUserId();
  if (uid != null) {
    const triage = initializeTriageListener(
      patientId,
      getTriageListener(state, dispatch)
    );
    unsubscribe.push(triage);

    const messages = initializeMessageListener(
      patientId,
      getMessageListener(dispatch)
    );
    unsubscribe.push(messages);
  }
}

function getTriageListener(
  state: StoreState,
  dispatch: (action: AnyAction) => void
) {
  return (doc: EncounterTriageDocument) => {
    if (!doc || !doc.docId) {
      return;
    }
    const patient = state.patients.find(patient => patient.uuid == doc.docId);
    if (!patient) {
      return;
    }
    const diagnoses = doc.triage.diagnoses;
    if (diagnoses && diagnoses.length > 0) {
      const diagnosis = diagnoses[diagnoses.length - 1];
      dispatch(
        setEvdStatus(
          patient.id,
          diagnosis.value,
          diagnosis.diagnoser,
          diagnosis.timestamp
        )
      );
    }
    dispatch(setTriageNotes(patient.id, doc.triage.notes));
  };
}

function getMessageListener(dispatch: (action: AnyAction) => void) {
  return (patientId: string, message: Message) => {
    dispatch(receiveChatMessage(patientId, message));
  };
}
