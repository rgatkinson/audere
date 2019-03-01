import "./src/hacks";
import React from "react";
import { Store } from "redux";
import { Persistor } from "redux-persist";
import { YellowBox } from "react-native";
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
        circlenumbers: require("./assets/fonts/circlenumbers.ttf"),
        UniSansRegular: require("./assets/fonts/UniSansRegular.otf"),
        Regular: require("./assets/fonts/Roboto-Regular.ttf"),
        SemiBold: require("./assets/fonts/Roboto-Medium.ttf"),
        Bold: require("./assets/fonts/Roboto-Bold.ttf"),
        ExtraBold: require("./assets/fonts/Roboto-Black.ttf"),
        Italic: require("./assets/fonts/Roboto-Italic.ttf"),
      }),
      getStore().then(store => (this.store = store)),
      getPersistor().then(persistor => (this.persistor = persistor)),
    ]);

    this.setState({ appReady: true });
  }

  render() {
    if (!this.state.appReady) {
      return <AppLoading />;
    }

    // According to https://github.com/infinitered/reactotron/issues/317#issuecomment-431627018
    // We need to wait to reference .connect() until .createStore() is done.
    // This attempts to do that.
    const ReloadAppOnLanguageChange = withNamespaces("common")(
      ConnectedAppWithNavigationState
    );

    return (
      <I18nextProvider i18n={i18n}>
        <Provider store={this.store}>
          <PersistGate loading={null} persistor={this.persistor!}>
            <ReloadAppOnLanguageChange />
          </PersistGate>
        </Provider>
      </I18nextProvider>
    );
  }
}
