// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { AppLoading } from "expo";
import * as Font from "expo-font";
import React from "react";
import { I18nextProvider, withNamespaces } from "react-i18next";
import { YellowBox } from "react-native";
import { useScreens } from "react-native-screens";
import { Provider } from "react-redux";
import { Store } from "redux";
import { Persistor } from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";
import "./src/hacks";
import i18n from "./src/i18n";
import { getPersistor, getStore } from "./src/store/";
import { initializeFirestore } from "./src/store/FirebaseStore";
import ConnectedRootContainer from "./src/ui/ConnectedRootContainer";
import { PubSubHub } from "./src/util/pubsub";
import { loadAllRemoteConfigs } from "./src/util/remoteConfig";
import { startTracking } from "./src/util/tracker";
import {
  setupErrorHandler,
  uploadingErrorHandler,
} from "./src/util/uploadingErrorHandler";
YellowBox.ignoreWarnings([
  "Class EXHomeModule",
  "Class EXTest",
  "Class EXDisabledDevMenu",
  "Class EXDisabledRedBox",
]);

useScreens();

export default class App extends React.Component {
  state = {
    appReady: false,
    assetsLoaded: false,
  };

  async componentDidMount() {
    this._loadAssets();
    setupErrorHandler();
    startTracking();
    PubSubHub.initialize();

    // We do these serially, for now, because we actually log things when
    // loading remote config, and you could in theory use remote config to
    // change how firestore behaves.  If we become confident that we'll never
    // use remote config to change firestore's behavior, we can
    // parallelize those two.
    await loadAllRemoteConfigs();
    await initializeFirestore();

    this.setState({ appReady: true });
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
        Regular: require("./assets/fonts/Roboto-Regular.ttf"),
        SemiBold: require("./assets/fonts/Roboto-Medium.ttf"),
        Bold: require("./assets/fonts/Roboto-Bold.ttf"),
        ExtraBold: require("./assets/fonts/Roboto-Black.ttf"),
        Italic: require("./assets/fonts/Roboto-Italic.ttf"),
      }),
      getStore().then(store => (this.store = store)),
      getPersistor().then(persistor => (this.persistor = persistor)),
    ]);
    this.setState({ assetsLoaded: true });
  }

  render() {
    if (!this.state.appReady || !this.state.assetsLoaded) {
      return <AppLoading />;
    }

    // According to https://github.com/infinitered/reactotron/issues/317#issuecomment-431627018
    // We need to wait to reference .connect() until .createStore() is done.
    // This attempts to do that.
    const ReloadAppOnLanguageChange = withNamespaces("common")(
      ConnectedRootContainer
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
