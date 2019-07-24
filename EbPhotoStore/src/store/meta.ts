// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export enum Screen {
  Login = "LOGIN",
  Patients = "PATIENTS",
  PatientDetails = "PATIENT_DETAILS"
}

export type MetaAction =
  | { type: "LOGIN"; login: string }
  | { type: "LOGOUT" }
  | { type: "VIEW_PATIENT"; id: number }
  | { type: "SET_ACTIVE_SCREEN_NAME"; screen: Screen };

export type MetaState = {
  currentPatient?: number;
  login?: string;
  screen: Screen;
};

const initialState: MetaState = {
  screen: Screen.Login
};

export default function reducer(state = initialState, action: MetaAction) {
  switch (action.type) {
    case "LOGIN":
      return { ...state, screen: Screen.Patients, login: action.login };
    case "LOGOUT":
      return { ...state, screen: Screen.Login, login: undefined };
    case "VIEW_PATIENT":
      return {
        ...state,
        currentPatient: action.id,
        screen: Screen.PatientDetails
      };
    case "SET_ACTIVE_SCREEN_NAME":
      return {
        ...state,
        currentPatient: undefined,
        screen: action.screen
      };
    default:
      return state;
  }
}

export function login(login: string): MetaAction {
  return {
    type: "LOGIN",
    login
  };
}

export function logout(): MetaAction {
  return {
    type: "LOGOUT"
  };
}

export function viewPatient(id: number): MetaAction {
  return {
    type: "VIEW_PATIENT",
    id
  };
}

export function setActiveScreenName(screen: Screen): MetaAction {
  return {
    type: "SET_ACTIVE_SCREEN_NAME",
    screen
  };
}
