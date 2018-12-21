export type AdminAction =
  | { type: "SET_ADMIN"; administrator: string | null }
  | { type: "SET_ADMINS"; admins: string[] }
  | { type: "SET_BLOOD_COLLECTION"; bloodCollection: boolean }
  | { type: "SET_LOCATION"; location: string }
  | { type: "SET_LOCATION_TYPE"; locationType: string };

export type AdminState = {
  administrator?: string | null;
  admins?: string[];
  bloodCollection: boolean;
  location?: string;
  locationType?: string;
};

const initialState: AdminState = {
  bloodCollection: false,
};

export default function reducer(state = initialState, action: AdminAction) {
  if (action.type === "SET_ADMIN") {
    return { ...state, administrator: action.administrator };
  }
  if (action.type === "SET_ADMINS") {
    return { ...state, admins: action.admins };
  }
  if (action.type === "SET_BLOOD_COLLECTION") {
    return { ...state, bloodCollection: action.bloodCollection };
  }
  if (action.type === "SET_LOCATION") {
    return { ...state, location: action.location };
  }
  if (action.type === "SET_LOCATION_TYPE") {
    return { ...state, locationType: action.locationType };
  }
  return state;
}

export function setAdministrator(administrator: string | null): AdminAction {
  return {
    type: "SET_ADMIN",
    administrator,
  };
}

export function setAdmins(admins: string[]): AdminAction {
  return {
    type: "SET_ADMINS",
    admins,
  };
}

export function setBloodCollection(bloodCollection: boolean): AdminAction {
  return {
    type: "SET_BLOOD_COLLECTION",
    bloodCollection,
  };
}
export function setLocation(location: string): AdminAction {
  return {
    type: "SET_LOCATION",
    location,
  };
}

export function setLocationType(locationType: string): AdminAction {
  return {
    type: "SET_LOCATION_TYPE",
    locationType,
  };
}
