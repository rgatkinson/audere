// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  ActivityIndicator,
  AppState,
  Dimensions,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import {
  Action,
  StoreState,
  appendEvent,
  clearState,
  setActiveRouteName,
  setCSRUIDIfUnset,
  setMarketingProperties,
  setShownOfflineWarning,
  setConnectivity,
} from "../store/";
import { AppEventsLogger } from "react-native-fbsdk";
import { Permissions } from "expo";
import { crashlytics } from "../crashReporter";
import {
  tracker,
  onCSRUIDEstablished,
  NavEvents,
  DrawerEvents,
  AppEvents,
} from "../util/tracker";
import { connect } from "react-redux";
import {
  DrawerActions,
  NavigationAction,
  NavigationActions,
  NavigationContainerComponent,
  NavigationState,
  StackActions,
  createAppContainer,
} from "react-navigation";
import { EventInfoKind, WorkflowInfo } from "audere-lib/coughProtocol";
import AppNavigator, { getActiveRouteName } from "./AppNavigator";
import { NAV_BAR_HEIGHT, STATUS_BAR_HEIGHT } from "./styles";
import { newCSRUID } from "../util/csruid";
import { uploadingErrorHandler } from "../util/uploadingErrorHandler";
import { getMarketingProperties, AppHealthEvents } from "../util/tracker";
import { getRemoteConfig, loadAllRemoteConfigs } from "../util/remoteConfig";
import MultiTapContainer from "./components/MultiTapContainer";

const AppContainer = createAppContainer(AppNavigator);

interface SplashProps {
  onUnmount(): void;
}

class SplashScreen extends React.Component<SplashProps> {
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
  isConnected: boolean;
  isDemo: boolean;
  lastUpdate?: number;
  workflow: WorkflowInfo;
  csruid?: string;
  appState: string;
  dispatch(action: Action): void;
}

class ConnectedRootContainer extends React.Component<Props> {
  state = {
    appState: "active",
  };

  constructor(props: Props) {
    super(props);
    this._handleNavChange = this._handleNavChange.bind(this);
    this._loadingIndicator = this._loadingIndicator.bind(this);
    this._onLaunch = this._onLaunch.bind(this);
  }

  navigator = React.createRef<NavigationContainerComponent>();

  _handleConnectivityChange = async (isConnected: boolean) => {
    this.props.dispatch(setConnectivity(isConnected));
  };

  _getConnectivity = () => {
    NetInfo.isConnected.fetch().then(isConnected => {
      this.props.dispatch(setConnectivity(isConnected));
    });
  };

  componentDidMount() {
    AppState.addEventListener("change", this._handleAppStateChange);
    this.props.dispatch(setMarketingProperties(getMarketingProperties()));
    if (this.props.csruid) {
      onCSRUIDEstablished(this.props.csruid);
    }
    this._getConnectivity();
    NetInfo.isConnected.addEventListener(
      "connectionChange",
      this._handleConnectivityChange
    );
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
      tracker.logEvent(AppEvents.APP_FOREGROUNDED, {
        screen: this.props.activeRouteName,
      });
      this.setState({ appState: nextAppState });
    } else if (
      this.state.appState === "active" &&
      nextAppState.match(/inactive|background/)
    ) {
      this.props.dispatch!(setShownOfflineWarning(false));
      tracker.logEvent(AppEvents.APP_BACKGROUNDED, {
        screen: this.props.activeRouteName,
      });
      this.setState({ appState: nextAppState });
    }

    const MILLIS_IN_SECOND = 1000.0;
    const SECONDS_IN_MINUTE = 60;
    const MINUTES_IN_HOUR = 60;
    const HOURS_IN_DAY = 24;

    const intervalMilis = currentDate.getTime() - this.props.lastUpdate;
    const elapsedMinutes =
      intervalMilis / (MILLIS_IN_SECOND * SECONDS_IN_MINUTE);
    const elapsedHours =
      intervalMilis / (MILLIS_IN_SECOND * SECONDS_IN_MINUTE * MINUTES_IN_HOUR);

    if (
      nextAppState === "launch" ||
      nextAppState === "active" ||
      nextAppState === "quadTap"
    ) {
      if (
        this.props.workflow.surveyCompletedAt &&
        (nextAppState === "quadTap" || elapsedHours > HOURS_IN_DAY)
      ) {
        // Successfully completed survey and 1 day has passed, clear state
        this.props.dispatch(
          appendEvent(
            EventInfoKind.TimeoutNav,
            "app:" + nextAppState + ":surveyCompleteRedirectToScreeningStart"
          )
        );
        this.clearState();
      } else if (
        this.props.workflow.surveyStartedAt &&
        (nextAppState === "quadTap" || elapsedHours > 4 * HOURS_IN_DAY)
      ) {
        // Started survey but did not finish, at least 4 days have passed, clear state
        this.props.dispatch(
          appendEvent(
            EventInfoKind.TimeoutNav,
            "app:" +
              nextAppState +
              ":surveyIncompleteExpirationRedirectToScreeningStart"
          )
        );
        this.clearState();
      } else if (this.props.activeRouteName === "CameraSettings") {
        const { status } = await Permissions.askAsync(Permissions.CAMERA);
        if (status === "granted") {
          this.navigator &&
            this.navigator.current &&
            this.navigator.current.dispatch(
              StackActions.replace({ routeName: "RDTReader" })
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
    const csruid = await newCSRUID();
    this.props.dispatch(setCSRUIDIfUnset(csruid));
  }

  _getNavEvent(action: NavigationAction): string | undefined {
    switch (action.type) {
      case NavigationActions.NAVIGATE:
      case StackActions.PUSH:
        return NavEvents.FORWARD;

      case NavigationActions.BACK:
      case StackActions.POP:
        return NavEvents.BACKWARD;
    }
  }

  _firebaseLogging(
    prevState: NavigationState,
    newState: NavigationState,
    action: NavigationAction
  ) {
    switch (action.type) {
      case DrawerActions.OPEN_DRAWER:
      case DrawerActions.CLOSE_DRAWER:
        const screen = getActiveRouteName(newState);
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
        const currentScreen = getActiveRouteName(prevState);
        const nextScreen = getActiveRouteName(newState);

        if (nextScreen && nextScreen !== currentScreen) {
          const navEvent = this._getNavEvent(action);

          tracker.setCurrentScreen(nextScreen);
          if (navEvent) {
            tracker.logEvent(navEvent, { from: currentScreen, to: nextScreen });
          }
        }
    }
  }

  _navLogging(
    prevState: NavigationState,
    newState: NavigationState,
    action: NavigationAction
  ) {
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
        const currentScreen = getActiveRouteName(prevState);
        const nextScreen = getActiveRouteName(newState);
        if (nextScreen != null && nextScreen !== currentScreen) {
          this.props.dispatch(appendEvent(EventInfoKind.AppNav, nextScreen));
          AppEventsLogger.logEvent(`navigation:${action.type}`, {
            from: currentScreen,
            to: nextScreen,
          });
          crashlytics.log(
            "Navigating from " + currentScreen + " to " + nextScreen
          );
        }
    }
  }

  _handleNavChange(
    prevState: NavigationState,
    newState: NavigationState,
    action: NavigationAction
  ) {
    const activeRouteName = getActiveRouteName(newState);
    if (
      this.props.activeRouteName != activeRouteName &&
      activeRouteName != null
    ) {
      this.props.dispatch(setActiveRouteName(activeRouteName));
      this._firebaseLogging(prevState, newState, action);
      this._navLogging(prevState, newState, action);
    }
  }

  _onLaunch = async () => {
    await this._handleAppStateChange("launch");
  };

  _loadingIndicator = () => {
    return <SplashScreen onUnmount={this._onLaunch} />;
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        <AppContainer
          persistenceKey={"NavigationStateAus"}
          ref={this.navigator}
          onNavigationStateChange={this._handleNavChange}
          renderLoadingExperimental={this._loadingIndicator}
        />
        <MultiTapContainer
          active={this.props.isDemo}
          taps={4}
          onMultiTap={() => this._handleAppStateChange("quadTap")}
        >
          <View style={styles.touchable} />
        </MultiTapContainer>
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
      isConnected: state.meta.isConnected,
      isDemo: state.meta.isDemo,
      lastUpdate: state.survey.timestamp,
      workflow: state.survey.workflow,
      csruid: state.survey.csruid,
    };
  } catch (e) {
    uploadingErrorHandler(e, true, "StoreState corrupted");

    const defaults = {
      activeRouteName: "Welcome",
      isConnected: false,
      isDemo: false,
      lastUpdate: undefined,
      workflow: {},
      csruid: undefined,
    };

    if (state == null) {
      return defaults;
    }

    return {
      activeRouteName: !!state.meta
        ? state.meta.activeRouteName
        : defaults.activeRouteName,
      isConnected: !!state.meta ? state.meta.isConnected : defaults.isConnected,
      isDemo: !!state.meta ? state.meta.isDemo : defaults.isDemo,
      lastUpdate: !!state.survey ? state.survey.timestamp : defaults.lastUpdate,
      workflow: !!state.survey ? state.survey.workflow : defaults.workflow,
      csruid: !!state.survey ? state.survey.csruid : defaults.csruid,
    };
  }
})(ConnectedRootContainer);
