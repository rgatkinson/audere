export type AdminAction =
  | { type: "SET_LOCATION"; location: string }
  | { type: "SET_BLOOD_COLLECTION"; bloodCollection: boolean }
  | { type: "ADD_FEEDBACK"; feedback: string };

export type AdminState = {
  location?: string;
  bloodCollection?: boolean;
  feedback: Array<string>;
};

const initialState: AdminState = {
  feedback: new Array<string>(),
};

export default function reducer(state = initialState, action: AdminAction) {
  if (action.type === "SET_LOCATION") {
    return { ...state, location: action.location };
  }
  if (action.type === "SET_BLOOD_COLLECTION") {
    return { ...state, bloodCollection: action.bloodCollection };
  }
  if (action.type === "ADD_FEEDBACK") {
    const feedback = state!.feedback.slice();
    feedback.push(action.feedback);
    return { ...state, feedback };
  }
  return state;
}

export function setLocation(location: string): AdminAction {
  return {
    type: "SET_LOCATION",
    location,
  };
}

export function setBloodCollection(bloodCollection: boolean): AdminAction {
  return {
    type: "SET_BLOOD_COLLECTION",
    bloodCollection,
  };
}

export function addFeedback(feedback: string): AdminAction {
  return {
    type: "ADD_FEEDBACK",
    feedback,
  };
}
