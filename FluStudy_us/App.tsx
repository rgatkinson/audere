// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

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
import { AppLoading } from "expo";
import * as Font from "expo-font";
import { getStore, getPersistor } from "./src/store/";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import ConnectedRootContainer from "./src/ui/ConnectedRootContainer";
import i18n from "./src/i18n";

import {
  setupErrorHandler,
  uploadingErrorHandler,
} from "./src/util/uploadingErrorHandler";
import { startTracking } from "./src/util/tracker";
import { loadAllRemoteConfigs } from "./src/util/remoteConfig";
import { initializeFirestore } from "./src/store/FirebaseStore";
import { PubSubHub } from "./src/util/pubsub";
import { useScreens } from "react-native-screens";
useScreens();

export default class App extends React.Component {
  state = {
    appReady: false,
  };

  async componentWillMount() {
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
