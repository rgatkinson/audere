export type AdminAction =
  | { type: "SET_LOCATION"; location: string }
  | { type: "SET_BLOOD_COLLECTION"; bloodCollection: boolean }
  | { type: "SET_LOCATION_TYPE"; locationType: string };

export type AdminState = {
  location?: string;
  locationType?: string;
  bloodCollection: boolean;
};

const initialState: AdminState = {
  bloodCollection: true,
};

export default function reducer(state = initialState, action: AdminAction) {
  if (action.type === "SET_LOCATION") {
    return { ...state, location: action.location };
  }
  if (action.type === "SET_LOCATION_TYPE") {
    return { ...state, locationType: action.locationType };
  }
  if (action.type === "SET_BLOOD_COLLECTION") {
    return { ...state, bloodCollection: action.bloodCollection };
  }
  return state;
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

export function setBloodCollection(bloodCollection: boolean): AdminAction {
  return {
    type: "SET_BLOOD_COLLECTION",
    bloodCollection,
  };
}
