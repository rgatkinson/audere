import "./src/hacks";
import React from "react";
import { AppState, StatusBar, YellowBox } from "react-native";
YellowBox.ignoreWarnings([
  "Class EXHomeModule",
  "Class EXTest",
  "Class EXDisabledDevMenu",
  "Class EXDisabledRedBox",
]);
import { I18nextProvider, withNamespaces } from "react-i18next";
import { AppLoading, Font } from "expo";
import {
  Action,
  StoreState,
  appendEvent,
  clearState,
  getActiveRouteName,
  store,
  persistor,
} from "./src/store/";
import { Provider, connect } from "react-redux";
import { createReduxContainer } from "react-navigation-redux-helpers";
import { PersistGate } from "redux-persist/integration/react";
import {
  NavigationActions,
  NavigationState,
  StackActions,
} from "react-navigation";
import { Feather } from "@expo/vector-icons";
import { EventInfoKind, WorkflowInfo } from "audere-lib/feverProtocol";
import AppNavigator from "./src/ui/AppNavigator";
import i18n from "./src/i18n";
import {
  setupErrorHandler,
  reportPreviousCrash,
  uploadingErrorHandler,
  ErrorProps,
} from "./src/crashReporter";

type AppProps = {
  exp?: {
    errorRecovery: ErrorProps;
  };
};

const AppContainer = createReduxContainer(AppNavigator);

interface Props {
  lastUpdate?: number;
  navigationState: NavigationState;
  workflow: WorkflowInfo;
  dispatch(action: Action): void;
}

class AppWithNavigationState extends React.Component<Props> {
  componentDidMount() {
    AppState.addEventListener("change", this._handleAppStateChange);
    this._handleAppStateChange("launch");
  }

  componentWillUnMount() {
    AppState.removeEventListener("change", this._handleAppStateChange);
  }

  _handleAppStateChange = (nextAppState: string) => {
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

    if (nextAppState === "launch" || nextAppState === "active") {
      if (
        this.props.workflow.screeningComplete &&
        !this.props.workflow.surveyStarted &&
        elapsedMinutes > 3 * MINUTES_IN_HOUR
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
        elapsedHours > HOURS_IN_DAY
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
        this.props.dispatch(clearState());
      } else if (
        !this.props.workflow.screeningComplete &&
        elapsedHours > 2 * HOURS_IN_DAY
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
        this.props.dispatch(clearState());
      } else if (
        this.props.workflow.surveyComplete &&
        elapsedHours > HOURS_IN_DAY
      ) {
        // Successfully completed survey and 1 day has passed, clear state
        this.props.dispatch(
          appendEvent(
            EventInfoKind.TimeoutNav,
            "app:" + nextAppState + ":surveyCompleteRedirectToScreeningStart"
          )
        );
        this.props.dispatch(clearState());
      } else if (
        this.props.workflow.surveyStarted &&
        elapsedHours > 4 * HOURS_IN_DAY
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
        this.props.dispatch(clearState());
      }
    }
  };

  render() {
    return (
      <AppContainer
        state={this.props.navigationState}
        dispatch={this.props.dispatch}
      />
    );
  }
}

const ConnectedAppWithNavigationState = connect((state: StoreState) => ({
  lastUpdate: state.survey.timestamp,
  navigationState: state.navigation,
  workflow: state.survey.workflow,
}))(AppWithNavigationState);

const ReloadAppOnLanguageChange = withNamespaces("common")(
  ConnectedAppWithNavigationState
);

export default class App extends React.Component<AppProps> {
  state = {
    appReady: false,
  };

  componentWillMount() {
    this._loadAssets();
    if (this.props.exp) {
      reportPreviousCrash(this.props.exp.errorRecovery);
    }
    setupErrorHandler();
  }

  componentDidCatch(error: Error) {
    uploadingErrorHandler(error, true);
    console.error(error);
  }

  async _loadAssets() {
    await Promise.all([
      Font.loadAsync({
        UniSansRegular: require("./assets/fonts/UniSansRegular.otf"),
        "OpenSans-Bold": require("./assets/fonts/OpenSans-Bold.ttf"),
        "OpenSans-ExtraBold": require("./assets/fonts/OpenSans-Bold.ttf"),
        "OpenSans-Italic": require("./assets/fonts/OpenSans-Italic.ttf"),
        "OpenSans-Regular": require("./assets/fonts/OpenSans-Regular.ttf"),
        "OpenSans-SemiBold": require("./assets/fonts/OpenSans-SemiBold.ttf"),
      }),
    ]);

    this.setState({ appReady: true });
  }

  render() {
    return this.state.appReady ? (
      <I18nextProvider i18n={i18n}>
        <StatusBar barStyle="dark-content" />
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <ReloadAppOnLanguageChange />
          </PersistGate>
        </Provider>
      </I18nextProvider>
    ) : (
      <AppLoading />
    );
  }
}
