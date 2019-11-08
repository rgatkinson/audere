// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { updateCollectionEnabled } from "../util/tracker";

export type MetaAction =
  | { type: "SET_ACTIVE_ROUTE_NAME"; activeRouteName: string }
  | {
      type: "SET_CAMERA_SETTINGS_GRANTED_PAGE";
      cameraSettingsGrantedPage: string;
    }
  | { type: "HAS_BEEN_OPENED" }
  | { type: "SET_CONNECTIVITY"; isConnected: boolean }
  | { type: "SET_OFFLINE_WARNING"; shownOfflineWarning: boolean }
  | { type: "SET_RDT_CAPTURE_FAIL_WARNING"; shownRDTFailWarning: boolean }
  | { type: "SCHEDULED_SURVEY_NOTIF" }
  | { type: "SET_DEMO"; isDemo: boolean }
  | {
      type: "SET_PATIENT_ACHIEVEMENT_INFO";
      patientAchievementInfo: PatientAchievementInfo;
    }
  | { type: "SET_ENTERED_EMAIL"; enteredEmail: string };

export type MetaState = {
  activeRouteName: string;
  cameraSettingsGrantedPage: string;
  hasBeenOpened: boolean;
  isConnected: boolean;
  isDemo: boolean;
  marketingProperties: any;
  shownOfflineWarning: boolean;
  shownRDTFailWarning: boolean;
  scheduledSurveyNotif: boolean;
  patientAchievementInfo: PatientAchievementInfo;
  enteredEmail: string;
};

const initialState: MetaState = {
  activeRouteName: "Welcome",
  cameraSettingsGrantedPage: "",
  hasBeenOpened: false,
  isConnected: true,
  isDemo: false,
  marketingProperties: undefined,
  shownOfflineWarning: false,
  shownRDTFailWarning: false,
  scheduledSurveyNotif: false,
  patientAchievementInfo: {
    actualEmail: "",
    state: "",
    zipCode: 0,
  },
  enteredEmail: "",
};

export type PatientAchievementInfo = {
  actualEmail: string;
  state: string;
  zipCode: number;
};

export default function reducer(state = initialState, action: MetaAction) {
  switch (action.type) {
    case "SET_ACTIVE_ROUTE_NAME":
      return { ...state, activeRouteName: action.activeRouteName };
    case "SET_CAMERA_SETTINGS_GRANTED_PAGE":
      return {
        ...state,
        cameraSettingsGrantedPage: action.cameraSettingsGrantedPage,
      };
    case "HAS_BEEN_OPENED":
      return { ...state, hasBeenOpened: true };
    case "SET_DEMO":
      return { ...state, isDemo: action.isDemo };
    case "SET_OFFLINE_WARNING":
      return { ...state, shownOfflineWarning: action.shownOfflineWarning };
    case "SET_RDT_CAPTURE_FAIL_WARNING":
      return { ...state, shownRDTFailWarning: action.shownRDTFailWarning };
    case "SET_CONNECTIVITY":
      return { ...state, isConnected: action.isConnected };
    case "SCHEDULED_SURVEY_NOTIF":
      return { ...state, scheduledSurveyNotif: true };
    case "SET_PATIENT_ACHIEVEMENT_INFO":
      return {
        ...state,
        patientAchievementInfo: action.patientAchievementInfo,
      };
    case "SET_ENTERED_EMAIL":
      return { ...state, enteredEmail: action.enteredEmail };
    default:
      return state;
  }
}

export function setActiveRouteName(activeRouteName: string): MetaAction {
  return {
    type: "SET_ACTIVE_ROUTE_NAME",
    activeRouteName,
  };
}

export function setCameraSettingsGrantedPage(
  cameraSettingsGrantedPage: string
): MetaAction {
  return {
    type: "SET_CAMERA_SETTINGS_GRANTED_PAGE",
    cameraSettingsGrantedPage,
  };
}

export function setDemo(isDemo: boolean): MetaAction {
  updateCollectionEnabled(isDemo);
  return {
    type: "SET_DEMO",
    isDemo,
  };
}

export function setShownOfflineWarning(
  shownOfflineWarning: boolean
): MetaAction {
  return {
    type: "SET_OFFLINE_WARNING",
    shownOfflineWarning,
  };
}

export function setShownRDTFailWarning(
  shownRDTFailWarning: boolean
): MetaAction {
  return {
    type: "SET_RDT_CAPTURE_FAIL_WARNING",
    shownRDTFailWarning,
  };
}

export function setConnectivity(isConnected: boolean): MetaAction {
  return {
    type: "SET_CONNECTIVITY",
    isConnected,
  };
}

export function setHasBeenOpened(): MetaAction {
  return {
    type: "HAS_BEEN_OPENED",
  };
}

export function setScheduledSurveyNotif(): MetaAction {
  return { type: "SCHEDULED_SURVEY_NOTIF" };
}

export function setPatientAchievementInfo(
  patientAchievementInfo: PatientAchievementInfo
): MetaAction {
  return { type: "SET_PATIENT_ACHIEVEMENT_INFO", patientAchievementInfo };
}

export function setEnteredEmail(enteredEmail: string): MetaAction {
  return { type: "SET_ENTERED_EMAIL", enteredEmail };
}
