// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { HealthWorkerInfo } from "audere-lib/ebPhotoStoreProtocol";

export enum Sort {
  name = "NAME",
  id = "ID",
  status = "STATUS",
  info = "INFO"
}

export enum Order {
  down = "DOWN",
  up = "UP"
}

export enum Screen {
  Login = "LOGIN",
  Patients = "PATIENTS",
  PatientDetails = "PATIENT_DETAILS",
  Camera = "CAMERA",
  CameraPermission = "CAMERA_PERMISSION",
  LocationPermission = "LOCATION_PERMISSION"
}

export type MetaAction =
  | { type: "TOGGLE_DEMO_MODE" }
  | { type: "LOGIN"; healthWorkerInfo: HealthWorkerInfo }
  | { type: "LOGOUT" }
  | { type: "VIEW_PATIENTS" }
  | { type: "VIEW_CAMERA_PERMISSION" }
  | { type: "VIEW_LOCATION_PERMISSION" }
  | { type: "VIEW_DETAILS"; id: number }
  | { type: "OPEN_CAMERA" }
  | { type: "SAVE_SORT"; sortBy: Sort[]; order: Order }
  | { type: "SET_FCM_TOKEN"; fcmToken: string };

export type MetaState = {
  currentPatient?: number;
  demoMode: boolean;
  fcmToken?: string;
  healthWorkerInfo?: HealthWorkerInfo;
  order: Order;
  screen: Screen;
  sortBy: Sort[];
};

const initialState: MetaState = {
  demoMode: false,
  order: Order.down,
  screen: Screen.Login,
  sortBy: [Sort.name, Sort.id]
};

export default function reducer(state = initialState, action: MetaAction) {
  switch (action.type) {
    case "TOGGLE_DEMO_MODE":
      return { ...state, demoMode: !state.demoMode };
    case "LOGIN":
      return {
        ...state,
        currentPatient: undefined,
        healthWorkerInfo: action.healthWorkerInfo,
        screen: Screen.Patients
      };
    case "LOGOUT":
      return {
        ...state,
        currentPatient: undefined,
        healthWorkerInfo: undefined,
        screen: Screen.Login
      };
    case "VIEW_PATIENTS":
      return {
        ...state,
        currentPatient: undefined,
        screen: Screen.Patients
      };
    case "VIEW_DETAILS":
      return {
        ...state,
        currentPatient: action.id,
        screen: Screen.PatientDetails
      };
    case "VIEW_CAMERA_PERMISSION":
      return {
        ...state,
        screen: Screen.CameraPermission
      };
    case "VIEW_LOCATION_PERMISSION":
      return {
        ...state,
        screen: Screen.LocationPermission
      };
    case "OPEN_CAMERA":
      return {
        ...state,
        screen: Screen.Camera
      };
    case "SET_FCM_TOKEN":
      return {
        ...state,
        fcmToken: action.fcmToken
      };
    case "SAVE_SORT":
      return {
        ...state,
        order: action.order,
        sortBy: action.sortBy
      };
    default:
      return state;
  }
}

export function toggleDemoMode(): MetaAction {
  return {
    type: "TOGGLE_DEMO_MODE"
  };
}

export function login(healthWorkerInfo: HealthWorkerInfo): MetaAction {
  return {
    type: "LOGIN",
    healthWorkerInfo
  };
}

export function logout(): MetaAction {
  return {
    type: "LOGOUT"
  };
}

export function viewPatients(): MetaAction {
  return {
    type: "VIEW_PATIENTS"
  };
}

export function viewDetails(id: number): MetaAction {
  return {
    type: "VIEW_DETAILS",
    id
  };
}

export function openCamera(): MetaAction {
  return {
    type: "OPEN_CAMERA"
  };
}

export function viewCameraPermission(): MetaAction {
  return {
    type: "VIEW_CAMERA_PERMISSION"
  };
}
export function viewLocationPermission(): MetaAction {
  return {
    type: "VIEW_LOCATION_PERMISSION"
  };
}

export function setFcmToken(fcmToken: string): MetaAction {
  return {
    type: "SET_FCM_TOKEN",
    fcmToken
  };
}

export function saveSort(sortBy: Sort[], order: Order): MetaAction {
  return {
    type: "SAVE_SORT",
    sortBy,
    order
  };
}
