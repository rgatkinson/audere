import React from "react";
import {
  ActivityIndicator,
  AppState,
  Dimensions,
  TouchableWithoutFeedback,
  View,
  StyleSheet,
} from "react-native";
import {
  Action,
  StoreState,
  appendEvent,
  clearState,
  setCSRUIDIfUnset,
  setMarketingProperties,
} from "../store/";
import { AppEventsLogger } from "react-native-fbsdk";
import { crashlytics } from "../crashReporter";
import { tracker, NavEvents, DrawerEvents, AppEvents } from "../util/tracker";
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
import { EventInfoKind, WorkflowInfo } from "audere-lib/feverProtocol";
import AppNavigator, { getActiveRouteName } from "./AppNavigator";
import { NAV_BAR_HEIGHT, STATUS_BAR_HEIGHT } from "./styles";
import { newCSRUID } from "../util/csruid";
import { uploadingErrorHandler } from "../util/uploadingErrorHandler";
import { getMarketingProperties } from "../util/tracker";

const AppContainer = createAppContainer(AppNavigator);

interface SplashProps {
  onUnmount(): void;
}

class SplashScreen extends React.Component<SplashProps> {
  componentWillUnmount() {
    this.props.onUnmount();
  }

  render() {
    return <ActivityIndicator />;
  }
}

interface Props {
  isDemo: boolean;
  lastUpdate?: number;
  workflow: WorkflowInfo;
  csruid?: string;
  appState: string;
  dispatch(action: Action): void;
}

class ConnectedRootContainer extends React.Component<Props> {
  state = {
    activeRouteName: "Welcome",
    appState: "active",
  };

  constructor(props: Props) {
    super(props);
    this._handleNavChange = this._handleNavChange.bind(this);
    this._loadingIndicator = this._loadingIndicator.bind(this);
    this._onLaunch = this._onLaunch.bind(this);
  }

  navigator = React.createRef<NavigationContainerComponent>();

  QUAD_PRESS_DELAY = 600;
  lastTap: number | null = null;
  secondLastTap: number | null = null;
  thirdLastTap: number | null = null;

  handleQuadTap = () => {
    if (this.props.isDemo) {
      const now = Date.now();
      if (
        this.lastTap != null &&
        this.secondLastTap != null &&
        this.thirdLastTap != null &&
        now - this.thirdLastTap! < this.QUAD_PRESS_DELAY
      ) {
        this._handleAppStateChange("quadTap");
      } else {
        this.thirdLastTap = this.secondLastTap;
        this.secondLastTap = this.lastTap;
        this.lastTap = now;
      }
    }
  };

  componentDidMount() {
    AppState.addEventListener("change", this._handleAppStateChange);
    this.props.dispatch(setMarketingProperties(getMarketingProperties()));
  }

  componentWillUnmount() {
    AppState.removeEventListener("change", this._handleAppStateChange);
  }

  _handleAppStateChange = (nextAppState: string) => {
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
      tracker.logEvent(AppEvents.APP_FOREGROUNDED, {
        screen: this.state.activeRouteName,
      });
      this.setState({ appState: nextAppState });
    } else if (
      this.state.appState === "active" &&
      nextAppState.match(/inactive|background/)
    ) {
      tracker.logEvent(AppEvents.APP_BACKGROUNDED, {
        screen: this.state.activeRouteName,
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
        this.props.workflow.screeningCompletedAt &&
        !this.props.workflow.surveyStartedAt &&
        (nextAppState === "quadTap" || elapsedMinutes > 3 * MINUTES_IN_HOUR)
      ) {
        // Have completed screening but not started survey and at least 3 hours have passed,
        // redirect to welcome back (survey)
        this.props.dispatch(
          appendEvent(
            EventInfoKind.TimeoutNav,
            "app:" + nextAppState + ":screeningCompleteRedirectToSurveyStart"
          )
        );
        this.navigator &&
          this.navigator.current &&
          this.navigator.current.dispatch(
            StackActions.reset({
              index: 0,
              actions: [
                NavigationActions.navigate({ routeName: "WelcomeBack" }),
              ],
            })
          );
      } else if (
        (this.state.activeRouteName === "AgeIneligible" ||
          this.state.activeRouteName === "SymptomsIneligible" ||
          this.state.activeRouteName === "StateIneligible" ||
          this.state.activeRouteName === "ConsentIneligible") &&
        (nextAppState === "quadTap" || elapsedHours > HOURS_IN_DAY)
      ) {
        // Was on ineligible screen for at least 24 hours, clear state
        this.props.dispatch(
          appendEvent(
            EventInfoKind.TimeoutNav,
            "app:" +
              nextAppState +
              ":ineligibleExpirationRedirectToScreeningStart"
          )
        );
        this.clearState();
      } else if (
        !this.props.workflow.screeningCompletedAt &&
        !this.props.workflow.skippedScreeningAt &&
        (nextAppState === "quadTap" || elapsedHours > 2 * HOURS_IN_DAY)
      ) {
        // Have not completed screening (not ordered kit) and 2 days have passed, clear state
        this.props.dispatch(
          appendEvent(
            EventInfoKind.TimeoutNav,
            "app:" +
              nextAppState +
              ":screeningExpirationRedirectToScreeningStart"
          )
        );
        this.clearState();
      } else if (
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
    if (this.state.activeRouteName != activeRouteName) {
      this.setState({ activeRouteName });
      this._firebaseLogging(prevState, newState, action);
      this._navLogging(prevState, newState, action);
    }
  }

  _onLaunch = () => {
    this._handleAppStateChange("launch");
  };

  _loadingIndicator = () => {
    return <SplashScreen onUnmount={this._onLaunch} />;
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={this.handleQuadTap}>
          <View style={styles.touchable} />
        </TouchableWithoutFeedback>
        <AppContainer
          persistenceKey={"NavigationState"}
          ref={this.navigator}
          onNavigationStateChange={this._handleNavChange}
          renderLoadingExperimental={this._loadingIndicator}
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
      isDemo: state.meta.isDemo,
      lastUpdate: state.survey.timestamp,
      workflow: state.survey.workflow,
      csruid: state.survey.csruid,
    };
  } catch (e) {
    uploadingErrorHandler(e, true, "StoreState corrupted");

    const defaults = {
      isDemo: false,
      lastUpdate: undefined,
      workflow: {},
      csruid: undefined,
    };

    if (state == null) {
      return defaults;
    }

    return {
      isDemo: !!state.meta ? state.meta.isDemo : defaults.isDemo,
      lastUpdate: !!state.survey ? state.survey.timestamp : defaults.lastUpdate,
      workflow: !!state.survey ? state.survey.workflow : defaults.workflow,
      csruid: !!state.survey ? state.survey.csruid : defaults.csruid,
    };
  }
})(ConnectedRootContainer);
