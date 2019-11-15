import i18n from "i18next";
import { Alert } from "react-native";
import {
  NavigationActions,
  NavigationScreenProp,
  StackActions,
} from "react-navigation";
import { Action, clearState } from "../store";

function clearNavState(
  nav: NavigationScreenProp<any, any>,
  dispatch: (action: Action) => void
) {
  dispatch(clearState());
  nav.dispatch(
    StackActions.reset({
      index: 0,
      actions: [NavigationActions.navigate({ routeName: "Welcome" })],
    })
  );
}

export function resetAlert(
  nav: NavigationScreenProp<any, any>,
  dispatch: (action: Action) => void
): boolean {
  Alert.alert(
    i18n.t("common:notifications:resetAppAlertTitle"),
    i18n.t("common:notifications:resetAppAlertBody"),
    [
      {
        text: i18n.t("common:button:no"),
      },
      {
        text: i18n.t("common:button:yes"),
        onPress: () => clearNavState(nav, dispatch),
      },
    ]
  );
  return false;
}
