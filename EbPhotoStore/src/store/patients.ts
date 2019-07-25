// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export type Patient = {
  id: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  details?: string;
  notes?: string;
  photoId?: string;
};

export type PatientAction =
  | {
      type: "ADD_PATIENT";
      firstName?: string;
      lastName?: string;
      phone?: string;
      details?: string;
      notes?: string;
    }
  | {
      type: "UPDATE_PATIENT";
      id: number;
      firstName?: string;
      lastName?: string;
      phone?: string;
      details?: string;
      notes?: string;
    }
  | { type: "SAVE_PHOTO"; id: number; photoId: string };

export type PatientState = Patient[];

const initialState: PatientState = [];

export default function reducer(state = initialState, action: PatientAction) {
  switch (action.type) {
    case "ADD_PATIENT":
      return [
        ...state,
        {
          id: state.length,
          firstName: action.firstName,
          lastName: action.lastName,
          phone: action.phone,
          details: action.details,
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
          firstName: action.firstName,
          lastName: action.lastName,
          phone: action.phone,
          details: action.details,
          notes: action.notes
        };
      });
    case "SAVE_PHOTO":
      return state.map((patient, index) => {
        if (index != action.id) {
          return patient;
        }
        return {
          ...patient,
          photoId: action.photoId
        };
      });

    default:
      return state;
  }
}

export function addPatient(
  firstName?: string,
  lastName?: string,
  phone?: string,
  details?: string,
  notes?: string
): PatientAction {
  return {
    type: "ADD_PATIENT",
    firstName,
    lastName,
    phone,
    details,
    notes
  };
}

export function updatePatient(
  id: number,
  firstName?: string,
  lastName?: string,
  phone?: string,
  details?: string,
  notes?: string
): PatientAction {
  return {
    type: "UPDATE_PATIENT",
    id,
    firstName,
    lastName,
    phone,
    details,
    notes
  };
}

export function savePhoto(id: number, photoId: string): PatientAction {
  return {
    type: "SAVE_PHOTO",
    id,
    photoId
  };
}
