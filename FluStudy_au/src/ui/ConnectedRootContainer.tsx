// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Dimensions,
  StyleSheet,
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
  setShownOfflineWarning,
  setConnectivity,
} from "../store/";
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
import { WithNamespaces, withNamespaces } from "react-i18next";
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
import { newUID } from "../util/csruid";
import { uploadingErrorHandler } from "../util/uploadingErrorHandler";
import MultiTapContainer from "./components/MultiTapContainer";

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

  componentDidMount() {
    AppState.addEventListener("change", this._handleAppStateChange);
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

    if (nextAppState === "quadTap") {
      this.props.dispatch(
        appendEvent(
          EventInfoKind.TimeoutNav,
          "app:" + nextAppState + ":redirectToScreeningStart"
        )
      );
      this.clearState();
    } else if (nextAppState === "launch" || nextAppState === "active") {
      if (elapsedHours > HOURS_IN_DAY) {
        const { t } = this.props;
        Alert.alert(
          t("relaunch:returningOrNewTitle"),
          t("relaunch:returningOrNewBody"),
          [
            {
              text: t("relaunch:button:newUser"),
              onPress: () => {
                tracker.logEvent(AppEvents.APP_IDLE_NEW_USER);
                this.props.dispatch(
                  appendEvent(
                    EventInfoKind.TimeoutNav,
                    "app:" + nextAppState + ":newUserRedirectToScreeningStart"
                  )
                );
                this.clearState();
              },
            },
            {
              text: t("relaunch:button:returningUser"),
              onPress: () => {
                tracker.logEvent(AppEvents.APP_IDLE_SAME_USER);
              },
            },
          ]
        );
      } else if (this.props.activeRouteName === "CameraSettings") {
        const { status } = await Permissions.askAsync(Permissions.CAMERA);
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
      case NavigationActions.NAVIGATE:
      case StackActions.PUSH:
        return NavEvents.FORWARD;

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
      tracker.setCurrentScreen(nextScreen);
      const navEvent = this._getNavEvent(action);
      if (navEvent) {
        tracker.logEvent(navEvent, { from: currentScreen, to: nextScreen });
      }
    }

    switch (action.type) {
      case DrawerActions.OPEN_DRAWER:
      case DrawerActions.CLOSE_DRAWER:
        tracker.logEvent(
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
          persistenceKey={"NavigationStateAus"}
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
