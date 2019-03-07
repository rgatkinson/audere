import React from "react";
import {
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
  getActiveRouteName,
} from "../store/";
import { connect } from "react-redux";
import { createReduxContainer } from "react-navigation-redux-helpers";
import {
  NavigationActions,
  NavigationState,
  StackActions,
} from "react-navigation";
import { EventInfoKind, WorkflowInfo } from "audere-lib/feverProtocol";
import AppNavigator from "./AppNavigator";
import { registerNavigator } from "./NavigatorRegistry";
import { NAV_BAR_HEIGHT, STATUS_BAR_HEIGHT } from "./styles";
import { newCSRUID } from "../util/csruid";

const navigator = AppNavigator;
registerNavigator(navigator);

const AppContainer = createReduxContainer(navigator);

interface Props {
  isDemo: boolean;
  lastUpdate?: number;
  navigationState: NavigationState;
  workflow: WorkflowInfo;
  csruid?: string;
  dispatch(action: Action): void;
}

class AppWithNavigationState extends React.Component<Props> {
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
    this._handleAppStateChange("launch");
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
    const activeRoute = getActiveRouteName(this.props.navigationState);

    if (this.props.lastUpdate == null) {
      return;
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
        this.props.dispatch(
          StackActions.reset({
            index: 0,
            actions: [NavigationActions.navigate({ routeName: "WelcomeBack" })],
          })
        );
      } else if (
        (activeRoute === "AgeIneligible" ||
          activeRoute === "SymptomsIneligible" ||
          activeRoute === "ConsentIneligible") &&
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
    this.props.dispatch(clearState());
    this.initializeCSRUID();
  }

  async initializeCSRUID(): Promise<void> {
    const csruid = await newCSRUID();
    this.props.dispatch(setCSRUIDIfUnset(csruid));
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={this.handleQuadTap}>
          <View style={styles.touchable} />
        </TouchableWithoutFeedback>
        <AppContainer
          state={this.props.navigationState}
          dispatch={this.props.dispatch}
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
  return {
    isDemo: state.meta.isDemo,
    lastUpdate: state.survey.timestamp,
    navigationState: state.navigation,
    workflow: state.survey.workflow,
    csruid: state.survey.csruid,
  };
})(AppWithNavigationState);
