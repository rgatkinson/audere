import "./src/hacks";
import React from "react";
import { Store } from "redux";
import { Persistor } from "redux-persist";
import { StatusBar, YellowBox } from "react-native";
YellowBox.ignoreWarnings([
  "Class EXHomeModule",
  "Class EXTest",
  "Class EXDisabledDevMenu",
  "Class EXDisabledRedBox",
]);
import { I18nextProvider, withNamespaces } from "react-i18next";
import { AppLoading, Font } from "expo";
import { getStore, getPersistor } from "./src/store/";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Feather } from "@expo/vector-icons";
import ConnectedAppWithNavigationState from "./src/ui/ConnectedAppWithNavigationState";
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

  store?: Store;
  persistor?: Persistor;

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
      getStore().then(store => (this.store = store)),
      getPersistor().then(persistor => (this.persistor = persistor)),
    ]);

    this.setState({ appReady: true });
  }

  render() {
    return this.state.appReady ? (
      <I18nextProvider i18n={i18n}>
        <StatusBar barStyle="dark-content" />
        <Provider store={this.store}>
          <PersistGate loading={null} persistor={this.persistor!}>
            <ReloadAppOnLanguageChange />
          </PersistGate>
        </Provider>
      </I18nextProvider>
    ) : (
      <AppLoading />
    );
  }
}
