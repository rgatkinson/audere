import "./src/hacks";
import React from "react";
import { StatusBar, YellowBox } from "react-native";
YellowBox.ignoreWarnings([
  "Class EXHomeModule",
  "Class EXTest",
  "Class EXDisabledDevMenu",
  "Class EXDisabledRedBox",
]);
import { I18nextProvider, withNamespaces } from "react-i18next";
import { AppLoading, Font } from "expo";
import { Action, StoreState, store, persistor } from "./src/store/";
import { Provider, connect } from "react-redux";
import { createReduxContainer } from "react-navigation-redux-helpers";
import { PersistGate } from "redux-persist/integration/react";
import { NavigationState } from "react-navigation";
import { Feather } from "@expo/vector-icons";
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
  dispatch(action: Action): void;
  navigationState: NavigationState;
}

class AppWithNavigationState extends React.Component<Props> {
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
  navigationState: state.navigation,
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
        "OpenSans-Regular": require("./assets/fonts/OpenSans-Regular.ttf"),
        "OpenSans-Bold": require("./assets/fonts/OpenSans-Bold.ttf"),
        "OpenSans-ExtraBold": require("./assets/fonts/OpenSans-Bold.ttf"),
        "OpenSans-SemiBold": require("./assets/fonts/OpenSans-SemiBold.ttf"),
        "DancingScript-Regular": require("./assets/fonts/DancingScript-Regular.otf"),
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
