import i18n from "i18next";
import { Alert } from "react-native";
import {
  NavigationActions,
  NavigationScreenProp,
  StackActions,
} from "react-navigation";
import { Action, appendEvent, clearState, setCSRUIDIfUnset } from "../store";
import { newUID } from "../util/csruid";
import { EventInfoKind } from "audere-lib/chillsProtocol";
import { NavigationResetAction } from "react-navigation";

export async function initializeCSRUID(
  dispatch: (action: Action) => void
): Promise<void> {
  const csruid = await newUID();
  dispatch(setCSRUIDIfUnset(csruid));
}

export function resetToBeginning(
  dispatchNav: (action: NavigationResetAction) => void,
  dispatchStore: (action: Action) => void,
  nextAppState: string
) {
  dispatchStore(
    appendEvent(
      EventInfoKind.AppNav,
      "app:" + nextAppState + ":redirectToScreeningStart"
    )
  );
  dispatchStore(clearState());
  dispatchNav(
    StackActions.reset({
      index: 0,
      actions: [NavigationActions.navigate({ routeName: "Welcome" })],
    })
  );
  initializeCSRUID(dispatchStore);
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
        onPress: () => resetToBeginning(nav.dispatch, dispatch, "active"),
      },
    ]
  );
  return false;
}
