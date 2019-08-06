// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { Fragment } from "react";
import { Store } from "redux";
import { Persistor } from "redux-persist";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { I18nextProvider } from "react-i18next";
import { getStore, getPersistor } from "./src/store/";
import AppController from "./src/ui/AppController";
import Splash from "./src/ui/Splash";
import i18n from "./src/i18n";

export default class App extends React.Component {
  state = {
    appReady: false,
  };

  store?: Store;
  persistor?: Persistor;

  async componentDidMount() {
    this._loadAssets();
  }

  async _loadAssets() {
    await Promise.all([
      getStore().then(store => (this.store = store)),
      getPersistor().then(persistor => (this.persistor = persistor)),
    ]);

    this.setState({ appReady: true });
  }

  render() {
    if (!this.state.appReady) {
      return <Splash />;
    }

    return (
      <I18nextProvider i18n={i18n}>
        <Provider store={this.store}>
          <PersistGate loading={null} persistor={this.persistor!}>
            <Fragment>
              <AppController />
            </Fragment>
          </PersistGate>
        </Provider>
      </I18nextProvider>
    );
  }
}
