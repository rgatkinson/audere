export type UserAction =
  | { type: "LOGGED_IN"; id: string; accessToken: string }
  | { type: "LOGGED_OUT" };

export type UserState = null | {
  id: string;
  accessToken: string;
};

const initialUserState: UserState = null;

export default function reducer(state = initialUserState, action: UserAction) {
  if (action.type === "LOGGED_IN") {
    return { id: action.id, accessToken: action.accessToken };
  }
  if (action.type === "LOGGED_OUT") {
    return null;
  }
  return state;
}

export function logIn(username: string, password: string): UserAction {
  return {
    type: "LOGGED_IN",
    id: username,
    accessToken: "todo-get-access-token",
  };
}

export function logOut(): UserAction {
  return {
    type: "LOGGED_OUT",
  };
}
