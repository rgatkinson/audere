// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export type Patient = {
  id: number;
  name: string;
  notes?: string;
};

export type PatientAction =
  | { type: "ADD_PATIENT"; name: string; notes?: string }
  | { type: "UPDATE_PATIENT"; id: number; name: string; notes?: string };

export type PatientState = Patient[];

const initialState: PatientState = [];

export default function reducer(state = initialState, action: PatientAction) {
  switch (action.type) {
    case "ADD_PATIENT":
      return [
        ...state,
        {
          id: state.length,
          name: action.name,
          notes: action.notes
        }
      ];
    case "UPDATE_PATIENT":
      return state.map((patient, index) => {
        if (index != action.id) {
          return patient;
        }
        return {
          ...patient,
          name: action.name,
          notes: action.notes
        };
      });
    default:
      return state;
  }
}

export function addPatient(name: string, notes?: string): PatientAction {
  return {
    type: "ADD_PATIENT",
    name,
    notes
  };
}

export function updatePatient(
  id: number,
  name: string,
  notes?: string
): PatientAction {
  return {
    type: "UPDATE_PATIENT",
    id,
    name,
    notes
  };
}
