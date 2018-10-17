export type Action =
  | { type: "LOGGED_IN"; id: string; accessToken: string }
  | { type: "LOGGED_OUT" };

export type State = null | {
  id: string;
  accessToken: string;
};

const initialState: State = null;

export default function reducer(state = initialState, action: Action) {
  if (action.type === "LOGGED_IN") {
    return { id: action.id, accessToken: action.accessToken };
  }
  if (action.type === "LOGGED_OUT") {
    return null;
  }
  return state;
}

export function logIn(username: string, password: string): Action {
  return {
    type: "LOGGED_IN",
    id: username,
    accessToken: "todo-get-access-token",
  };
}

export function logOut(): Action {
  return {
    type: "LOGGED_OUT",
  };
}
