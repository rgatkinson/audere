// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { MiddlewareAPI, Dispatch, AnyAction } from "redux";
import { PatientState, StoreState } from "./index";
import {
  DocumentType,
  HealthWorkerInfo,
  PatientInfo,
  EncounterInfo
} from "audere-lib/ebPhotoStoreProtocol";
import { syncEncounter } from "./FirebaseStore";
import { retryUploads } from "../transport/photoUploader";

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
          const encounterDocument = reduxToFirebase(state, patientId);
          syncEncounter(state.patients[patientId].uuid, encounterDocument);
        }
        break;
      case "VIEW_PATIENTS":
        retryUploads();
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
    notes: state.meta.healthWorkerInfo.notes || ""
  };
  return {
    isDemo: false,
    healthWorker,
    localIndex: reduxPatient.id.toString(),
    patient: reduxPatient.patientInfo,
    rdtPhotos: reduxPatient.photoInfo,
    notes: reduxPatient.notes || ""
  };
}
