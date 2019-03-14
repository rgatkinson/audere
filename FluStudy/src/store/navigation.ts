import { AnyAction, Dispatch, MiddlewareAPI, Store } from "redux";
import {
  DrawerActions,
  NavigationAction,
  NavigationActions,
  NavigationState,
  StackActions,
} from "react-navigation";
import { AppEventsLogger } from "react-native-fbsdk";
import { EventInfoKind } from "audere-lib/feverProtocol";
import { appendEvent } from "./survey";
import { getAppNavigator } from "../ui/NavigatorRegistry";
import { tracker, NavEvents, DrawerEvents } from "../util/tracker";
import { Crashlytics } from "react-native-fabric";

const initialState = {
  closeId: 1,
  index: 0,
  isDrawerOpen: false,
  openId: 0,
  toggleId: 2,
  routes: [
    {
      index: 0,
      key: "Home",
      routeName: "Home",
      routes: [{ index: 0, routeName: "Welcome" }],
    },
    { index: 1, key: "About", routeName: "About" },
    { index: 2, key: "Funding", routeName: "Funding" },
    { index: 3, key: "Partners", routeName: "Partners" },
    { index: 4, key: "GeneralQuestions", routeName: "GeneralQuestions" },
    { index: 5, key: "Problems", routeName: "Problems" },
    { index: 6, key: "TestQuestions", routeName: "TestQuestions" },
    { index: 7, key: "GiftcardQuestions", routeName: "GiftcardQuestions" },
    { index: 8, key: "ContactSupport", routeName: "ContactSupport" },
    { index: 9, key: "Version", routeName: "Version" },
  ],
};

export default function reducer(
  state: NavigationState = initialState,
  action: NavigationAction
) {
  if (state == null) {
    state = initialState;
  }
  const navigator = getAppNavigator();
  if (navigator == null) {
    return state;
  }
  return navigator.router.getStateForAction(action, state);
}

export function getActiveRouteName(
  navigationState: NavigationState
): string | null {
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
      case StackActions.RESET:
        const currentScreen = getActiveRouteName(store.getState().navigation);
        const result = next(action);
        const nextScreen = getActiveRouteName(store.getState().navigation);
        if (nextScreen != null && nextScreen !== currentScreen) {
          store.dispatch(appendEvent(EventInfoKind.AppNav, nextScreen));
          AppEventsLogger.logEvent(`navigation:${action.type}`, {
            from: currentScreen,
            to: nextScreen,
          });
          Crashlytics.log(
            "Navigating from " + currentScreen + " to " + nextScreen
          );
        }
        return result;
    }
    return next(action);
  };
}

function getNavEvent(action: AnyAction): string | undefined {
  switch (action.type) {
    case NavigationActions.NAVIGATE:
    case StackActions.PUSH:
      return NavEvents.FORWARD;

    case NavigationActions.BACK:
    case StackActions.POP:
      return NavEvents.BACKWARD;
  }
}

export function firebaseNavigationLoggingMiddleware(store: MiddlewareAPI) {
  return (next: Dispatch) => (action: AnyAction) => {
    switch (action.type) {
      case DrawerActions.OPEN_DRAWER:
      case DrawerActions.CLOSE_DRAWER:
        const screen = getActiveRouteName(store.getState().navigation);

        tracker.logEvent(
          action.type == DrawerActions.OPEN_DRAWER
            ? DrawerEvents.OPEN
            : DrawerEvents.CLOSE,
          { screen }
        );
        break;

      case NavigationActions.NAVIGATE:
      case NavigationActions.BACK:
      case StackActions.POP:
      case StackActions.POP_TO_TOP:
      case StackActions.PUSH:
      case StackActions.RESET:
        const currentScreen = getActiveRouteName(store.getState().navigation);
        const result = next(action);
        const nextScreen = getActiveRouteName(store.getState().navigation);

        if (nextScreen && nextScreen !== currentScreen) {
          const navEvent = getNavEvent(action);

          tracker.setCurrentScreen(nextScreen);
          if (navEvent) {
            tracker.logEvent(navEvent, { from: currentScreen, to: nextScreen });
          }
        }
        return result;
    }
    return next(action);
  };
}
