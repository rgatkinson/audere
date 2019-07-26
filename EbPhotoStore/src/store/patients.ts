// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { PatientInfo, PhotoInfo } from "audere-lib/ebPhotoStoreProtocol";

export type PatientEncounter = {
  id: number;
  patientInfo: PatientInfo;
  notes?: string;
  photoInfo?: PhotoInfo;
};

export type PatientAction =
  | {
      type: "ADD_PATIENT";
      patientInfo: PatientInfo;
      notes?: string;
    }
  | {
      type: "UPDATE_PATIENT";
      id: number;
      patientInfo: PatientInfo;
      notes?: string;
    }
  | { type: "SAVE_PHOTO"; id: number; photoInfo: PhotoInfo };

export type PatientState = PatientEncounter[];

const initialState: PatientState = [];

export default function reducer(state = initialState, action: PatientAction) {
  switch (action.type) {
    case "ADD_PATIENT":
      return [
        ...state,
        {
          id: state.length,
          patientInfo: action.patientInfo,
          notes: action.notes
        }
      ];
    case "UPDATE_PATIENT":
      return state.map((patient, index) => {
        if (index != action.id) {
          return patient;
        }
        return {
          id: patient.id,
          patientInfo: action.patientInfo,
          notes: action.notes,
          ...patient
        };
      });
    case "SAVE_PHOTO":
      return state.map((patient, index) => {
        if (index != action.id) {
          return patient;
        }
        return {
          ...patient,
          photoInfo: action.photoInfo
        };
      });

    default:
      return state;
  }
}

export function addPatient(
  patientInfo: PatientInfo,
  notes?: string
): PatientAction {
  return {
    type: "ADD_PATIENT",
    patientInfo,
    notes
  };
}

export function updatePatient(
  id: number,
  patientInfo: PatientInfo,
  notes?: string
): PatientAction {
  return {
    type: "UPDATE_PATIENT",
    id,
    patientInfo,
    notes
  };
}

export function savePhoto(id: number, photoInfo: PhotoInfo): PatientAction {
  return {
    type: "SAVE_PHOTO",
    id,
    photoInfo
  };
}
