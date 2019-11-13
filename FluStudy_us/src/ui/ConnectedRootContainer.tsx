// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import NetInfo from "@react-native-community/netinfo";
import { EventInfoKind, WorkflowInfo } from "audere-lib/chillsProtocol";
import * as Permissions from "expo-permissions";
import React from "react";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  ActivityIndicator,
  AppState,
  AsyncStorage,
  Dimensions,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import {
  createAppContainer,
  NavigationAction,
  NavigationActions,
  NavigationContainerComponent,
  NavigationState,
  StackActions,
} from "react-navigation";
import { DrawerActions } from "react-navigation-drawer";
import { connect } from "react-redux";
import { crashlytics } from "../crashReporter";
import {
  Action,
  appendEvent,
  clearState,
  setActiveRouteName,
  setConnectivity,
  setCSRUIDIfUnset,
  setMarketingProperties,
  setShownOfflineWarning,
  StoreState,
} from "../store/";
import { newUID } from "../util/csruid";
import { notificationLaunchHandler } from "../util/notifications";
import {
  AppEvents,
  DrawerEvents,
  logCurrentScreen,
  logFirebaseEvent,
  NavEvents,
  onCSRUIDEstablished,
} from "../util/tracker";
import { uploadingErrorHandler } from "../util/uploadingErrorHandler";
import AppNavigator, { getActiveRouteName } from "./AppNavigator";
import MultiTapContainer from "./components/MultiTapContainer";
import { NAV_BAR_HEIGHT, STATUS_BAR_HEIGHT } from "./styles";
import RNReferrer from "react-native-referrer";

notificationLaunchHandler();

const AppContainer = createAppContainer(AppNavigator);

interface SplashProps {
  onUnmount(): void;
}

class SplashScreen extends React.PureComponent<SplashProps> {
  componentWillUnmount() {
    this.props.onUnmount();
  }

  render() {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
}

interface Props {
  activeRouteName: string;
  isDemo: boolean;
  lastUpdate?: number;
  workflow: WorkflowInfo;
  csruid?: string;
  dispatch(action: Action): void;
  cameraSettingsGrantedPage: string;
}

const persistenceKey = "NavigationStateAus";
const persistNavigationState = async (navState: any) => {
  try {
    // Scrub out drawer-specific navState IDs that are not unique across relaunch
    const { openId, closeId, toggleId, ...scrubbedNavState } = navState;
    await AsyncStorage.setItem(
      persistenceKey,
      JSON.stringify(scrubbedNavState)
    );
  } catch (err) {
    // handle the error according to your needs
  }
};
const loadNavigationState = async () => {
  const jsonString = await AsyncStorage.getItem(persistenceKey);
  return !!jsonString ? JSON.parse(jsonString) : "";
};

class ConnectedRootContainer extends React.Component<Props & WithNamespaces> {
  shouldComponentUpdate(props: Props) {
    return props.isDemo != this.props.isDemo;
  }

  state = {
    appState: "active",
  };

  navigator = React.createRef<NavigationContainerComponent>();

  _handleConnectivityChange = async (isConnected: boolean) => {
    this.props.dispatch(setConnectivity(isConnected));
  };

  _getConnectivity = () => {
    NetInfo.isConnected.fetch().then(isConnected => {
      this.props.dispatch(setConnectivity(isConnected));
    });
  };

  _setMarketingProperties = async () => {
    const referrer = await RNReferrer.getReferrer();
    if (!!referrer) {
      this.props.dispatch(setMarketingProperties({ referrer }));
    }
  };

  componentDidMount() {
    AppState.addEventListener("change", this._handleAppStateChange);
    if (this.props.csruid) {
      onCSRUIDEstablished(this.props.csruid);
    }
    NetInfo.isConnected.addEventListener(
      "connectionChange",
      this._handleConnectivityChange
    );
    this._getConnectivity();
    this._setMarketingProperties();
  }

  componentWillUnmount() {
    AppState.removeEventListener("change", this._handleAppStateChange);
    NetInfo.isConnected.removeEventListener(
      "connectionChange",
      this._handleConnectivityChange
    );
  }

  _handleAppStateChange = async (nextAppState: string) => {
    // Bleagh.
    //
    // For idempotence and security, we need to call the uploader with
    // a csruid, but we can only generate csruids asynchronously.  So
    // attempt to acquire one whenever we notice we don't have one.
    //
    // Similarly, we attempt to acquire one whenever we clear state below.
    if (!this.props.csruid) {
      this.initializeCSRUID();
    }

    // NOTE system notifications (camera, push notification permission requests) toggle
    // the app's active/inactive state. This is fine for now since we don't have any timeouts
    // here that happen immediately, all require a minimum amount of elapsed time. This could
    // be an issue in the future.
    const currentDate = new Date();

    if (this.props.lastUpdate == null) {
      return;
    }

    if (
      this.state.appState.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      this._getConnectivity();
      logFirebaseEvent(AppEvents.APP_FOREGROUNDED, {
        screen: this.props.activeRouteName,
      });
      this.setState({ appState: nextAppState });
    } else if (
      this.state.appState === "active" &&
      nextAppState.match(/inactive|background/)
    ) {
      this.props.dispatch!(setShownOfflineWarning(false));
      logFirebaseEvent(AppEvents.APP_BACKGROUNDED, {
        screen: this.props.activeRouteName,
      });
      this.setState({ appState: nextAppState });
    }

    if (nextAppState === "quadTap") {
      this.props.dispatch(
        appendEvent(
          EventInfoKind.TimeoutNav,
          "app:" + nextAppState + ":redirectToScreeningStart"
        )
      );
      this.clearState();
    } else if (nextAppState === "launch" || nextAppState === "active") {
      if (this.props.activeRouteName === "CameraSettings") {
        // Expo V35 currently has an issue on iOS where permissions aren't queried
        // correctly when using Permissions.getAsync. The workaround is to use
        // Permissions.askAsync instead, but on Android this has the unfortunate side-effect
        // of repeatedly asking the user for camera permissions. To avoid that, we'll only
        // use askAsync on iOS.
        const { status } =
          Platform.OS === "ios"
            ? await Permissions.askAsync(Permissions.CAMERA)
            : await Permissions.getAsync(Permissions.CAMERA);
        if (status === "granted") {
          this.navigator &&
            this.navigator.current &&
            !!this.props.cameraSettingsGrantedPage &&
            this.navigator.current.dispatch(
              StackActions.replace({
                routeName: this.props.cameraSettingsGrantedPage,
              })
            );
        }
      }
    }
  };

  clearState() {
    this.navigator &&
      this.navigator.current &&
      this.navigator.current.dispatch(
        StackActions.reset({
          index: 0,
          actions: [NavigationActions.navigate({ routeName: "Welcome" })],
        })
      );
    this.props.dispatch(clearState());
    this.initializeCSRUID();
  }

  async initializeCSRUID(): Promise<void> {
    const csruid = await newUID();
    this.props.dispatch(setCSRUIDIfUnset(csruid));
  }

  _getNavEvent(action: NavigationAction): string | undefined {
    switch (action.type) {
      case NavigationActions.BACK:
      case StackActions.POP:
        return NavEvents.BACKWARD;
    }
  }

  _handleNavChange = (
    prevState: NavigationState,
    newState: NavigationState,
    action: NavigationAction
  ) => {
    const currentScreen = this.props.activeRouteName;
    const nextScreen = getActiveRouteName(newState);

    if (nextScreen != null && nextScreen !== currentScreen) {
      this.props.dispatch(setActiveRouteName(nextScreen));
      this.props.dispatch(appendEvent(EventInfoKind.AppNav, nextScreen));
      crashlytics.log("Navigating from " + currentScreen + " to " + nextScreen);
      logCurrentScreen(nextScreen);
      const navEvent = this._getNavEvent(action);

      if (navEvent) {
        logFirebaseEvent(navEvent, { from: currentScreen, to: nextScreen });
      }
    }

    switch (action.type) {
      case DrawerActions.OPEN_DRAWER:
      case DrawerActions.CLOSE_DRAWER:
        logFirebaseEvent(
          action.type == DrawerActions.OPEN_DRAWER
            ? DrawerEvents.OPEN
            : DrawerEvents.CLOSE,
          { screen: nextScreen }
        );
        break;
    }
  };

  _onLaunch = async () => {
    await this._handleAppStateChange("launch");
  };

  _loadingIndicator = () => {
    return <SplashScreen onUnmount={this._onLaunch} />;
  };

  _handleQuadTap = () => {
    this._handleAppStateChange("quadTap");
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        <AppContainer
          loadNavigationState={loadNavigationState}
          persistNavigationState={persistNavigationState}
          ref={this.navigator}
          onNavigationStateChange={this._handleNavChange}
          renderLoadingExperimental={this._loadingIndicator}
        />
        <MultiTapContainer
          active={this.props.isDemo}
          style={styles.touchable}
          taps={4}
          onMultiTap={this._handleQuadTap}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  touchable: {
    height: STATUS_BAR_HEIGHT + NAV_BAR_HEIGHT,
    left: Dimensions.get("window").width / 2 - 100,
    position: "absolute",
    width: 200,
    zIndex: 3,
  },
});

export default connect((state: StoreState) => {
  try {
    return {
      activeRouteName: state.meta.activeRouteName,
      isDemo: state.meta.isDemo,
      lastUpdate: state.survey.timestamp,
      workflow: state.survey.workflow,
      csruid: state.survey.csruid,
      cameraSettingsGrantedPage: state.meta.cameraSettingsGrantedPage,
    };
  } catch (e) {
    uploadingErrorHandler(e, true, "StoreState corrupted");

    const defaults = {
      activeRouteName: "Welcome",
      isDemo: false,
      lastUpdate: undefined,
      workflow: {},
      csruid: undefined,
      cameraSettingsGrantedPage: "",
    };

    if (state == null) {
      return defaults;
    }

    return {
      activeRouteName: !!state.meta
        ? state.meta.activeRouteName
        : defaults.activeRouteName,
      isDemo: !!state.meta ? state.meta.isDemo : defaults.isDemo,
      lastUpdate: !!state.survey ? state.survey.timestamp : defaults.lastUpdate,
      workflow: !!state.survey ? state.survey.workflow : defaults.workflow,
      csruid: !!state.survey ? state.survey.csruid : defaults.csruid,
      cameraSettingsGrantedPage: !!state.meta
        ? state.meta.cameraSettingsGrantedPage
        : defaults.cameraSettingsGrantedPage,
    };
  }
})(withNamespaces()(ConnectedRootContainer));
