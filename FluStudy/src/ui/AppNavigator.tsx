import React from "react";
import {
  NavigationAction,
  NavigationActions,
  NavigationState,
  StackActions,
  createDrawerNavigator,
  createStackNavigator,
} from "react-navigation";
import { uploadingErrorHandler } from "../util/uploadingErrorHandler";
import {
  Why,
  What,
  OutOfKits,
  Age,
  Symptoms,
  AddressScreen,
  AddressConfirm,
  SymptomsIneligible,
  PreConsent,
  Consent,
  ConsentIneligible,
  KitOrdered,
  ThankYouScreening,
} from "./screens/ScreeningScreens";
import {
  WelcomeBack,
  ScanInstructions,
  Scan,
  ScanConfirmation,
  ManualEntry,
  ManualConfirmation,
  BarcodeContactSupport,
  SwabInTube,
  FirstTimer,
  StripInTube,
  WhatSymptoms,
  WhenSymptoms,
  GeneralExposure,
  GeneralHealth,
  ThankYouSurvey,
  TestStripSurvey,
  PictureInstructions,
  TestStripCamera,
  TestStripConfirmation,
  FirstTestFeedback,
  SecondTestFeedback,
  ShipBox,
  SchedulePickup,
  EmailOptIn,
  Thanks,
} from "./screens/SurveyScreens";
import { Menu, generateMenuScreen } from "./screens/MenuScreens";
import { menuScreens } from "../resources/MenuConfig";
import {
  simpleScreens,
  generateSimpleScreen,
} from "../resources/SimpleScreenConfig";

const mainScreens = {
  Why,
  What,
  OutOfKits,
  Age,
  Symptoms,
  SymptomsIneligible,
  PreConsent,
  Consent,
  ConsentIneligible,
  Address: AddressScreen,
  AddressConfirm,
  KitOrdered,
  ThankYouScreening,
  WelcomeBack,
  ScanInstructions,
  Scan,
  ScanConfirmation,
  ManualEntry,
  ManualConfirmation,
  BarcodeContactSupport,
  SwabInTube,
  FirstTimer,
  StripInTube,
  WhatSymptoms,
  WhenSymptoms,
  GeneralExposure,
  GeneralHealth,
  ThankYouSurvey,
  TestStripSurvey,
  PictureInstructions,
  TestStripCamera,
  TestStripConfirmation,
  FirstTestFeedback,
  SecondTestFeedback,
  ShipBox,
  SchedulePickup,
  EmailOptIn,
  Thanks,
};

const homeRouteConfig = simpleScreens.reduce(
  (homeRouteConfig, simpleScreenConfig) => ({
    ...homeRouteConfig,
    [simpleScreenConfig.key]: {
      screen: generateSimpleScreen(simpleScreenConfig),
    },
  }),
  { ...mainScreens }
);

const Home = createStackNavigator(homeRouteConfig, {
  initialRouteName: "Welcome",
  // @ts-ignore
  defaultNavigationOptions: {
    gesturesEnabled: false,
  },
  headerMode: "none",
});

export const getActiveRouteName = (
  navigationState: NavigationState
): string | null => {
  if (!navigationState) {
    return null;
  }
  try {
    const route = navigationState.routes[navigationState.index];
    // dive into nested navigators
    if (route.routes) {
      // @ts-ignore
      return getActiveRouteName(route);
    }
    return route.routeName;
  } catch (e) {
    uploadingErrorHandler(e, true, "NavigationState corrupted");
    return null;
  }
};

const withNavigationPreventDuplicate = (getStateForAction: any) => {
  const defaultGetStateForAction = getStateForAction;
  const getStateForActionWithoutDuplicates = (
    action: NavigationAction,
    state: NavigationState
  ) => {
    if (
      action.type === NavigationActions.NAVIGATE ||
      action.type === StackActions.PUSH
    ) {
      // Note: this is fine for now because we don't ever navigate to the same screen with different parameters,
      // but if we did, we'd want to do a deep comparison of the route.params
      const currentRouteName = getActiveRouteName(state);
      if (currentRouteName === action.routeName) {
        return null;
      }
    }

    return defaultGetStateForAction(action, state);
  };
  return getStateForActionWithoutDuplicates;
};

Home.router.getStateForAction = withNavigationPreventDuplicate(
  Home.router.getStateForAction
);

const routeConfig = menuScreens.reduce(
  (routeConfig, menuConfig) => ({
    ...routeConfig,
    [menuConfig.key]: { screen: generateMenuScreen(menuConfig) },
  }),
  { Home }
);

export default createDrawerNavigator(routeConfig, {
  contentComponent: Menu,
  drawerPosition: "right",
});
