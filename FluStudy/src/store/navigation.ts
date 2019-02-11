import { AnyAction, Dispatch, MiddlewareAPI, Store } from "redux";
import {
  DrawerActions,
  NavigationState,
  NavigationAction,
  NavigationActions,
  StackActions,
} from "react-navigation";
import { EventInfoKind } from "audere-lib/feverProtocol";
import { appendEvent } from "./index";
import AppNavigator from "../ui/AppNavigator";

const initialAction = { type: NavigationActions.INIT };
const initialState = AppNavigator.router.getStateForAction(initialAction);

export default function reducer(
  state = initialState,
  action: NavigationAction
) {
  return AppNavigator.router.getStateForAction(action, state);
}

function getActiveRouteName(navigationState: NavigationState): string | null {
  if (!navigationState) {
    return null;
  }
  const route = navigationState.routes[navigationState.index];
  // dive into nested navigators
  // @ts-ignore
  if (route.routes) {
    // @ts-ignore
    return getActiveRouteName(route);
  }
  return route.routeName;
}

export function navigationLoggingMiddleware(store: MiddlewareAPI) {
  return (next: Dispatch) => (action: AnyAction) => {
    switch (action.type) {
      case NavigationActions.NAVIGATE:
      case NavigationActions.BACK:
      case DrawerActions.OPEN_DRAWER:
      case DrawerActions.CLOSE_DRAWER:
      case DrawerActions.TOGGLE_DRAWER:
      case StackActions.POP:
      case StackActions.POP_TO_TOP:
      case StackActions.PUSH:
        const currentScreen = getActiveRouteName(store.getState().navigation);
        const result = next(action);
        const nextScreen = getActiveRouteName(store.getState().navigation);
        if (nextScreen != null && nextScreen !== currentScreen) {
          store.dispatch(appendEvent(EventInfoKind.AppNav, nextScreen));
        }
        return result;
    }
    return next(action);
  };
}
