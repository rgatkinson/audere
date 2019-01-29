import "./src/hacks";
import React from "react";
import { YellowBox } from 'react-native';
YellowBox.ignoreWarnings([
  'Class EXHomeModule',
  'Class EXTest',
  'Class EXDisabledDevMenu',
  'Class EXDisabledRedBox',
]);
import {
  createStackNavigator,
  NavigationScreenProp,
} from "react-navigation";
import { AppLoading, Font } from "expo";
import { store, persistor } from "./src/store/";
import { Provider, connect } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { I18nextProvider, withNamespaces } from "react-i18next";
import { Feather } from "@expo/vector-icons";
import i18n from "./src/i18n";
import {
  setupErrorHandler,
  reportPreviousCrash,
  uploadingErrorHandler,
  ErrorProps,
} from "./src/crashReporter";

import WelcomeScreen from "./src/ui/screens/screening/WelcomeScreen";
import WhyScreen from "./src/ui/screens/screening/WhyScreen";
import WhatScreen from "./src/ui/screens/screening/WhatScreen";
import AgeScreen from "./src/ui/screens/screening/AgeScreen";
import SymptomsScreen from "./src/ui/screens/screening/SymptomsScreen";
import IneligibleScreen from "./src/ui/screens/screening/IneligibleScreen";
import ConsentScreen from "./src/ui/screens/screening/ConsentScreen";
import AddressScreen from "./src/ui/screens/screening/AddressScreen";
import ConfirmationScreen from "./src/ui/screens/screening/ConfirmationScreen";
import PushNotificationsScreen from "./src/ui/screens/screening/PushNotificationsScreen";
import InstructionsScreen from "./src/ui/screens/screening/InstructionsScreen";
import ExtraInfoScreen from "./src/ui/screens/screening/ExtraInfoScreen";

const Home = createStackNavigator(
  {
    Welcome: WelcomeScreen,
    Why: WhyScreen,
    What: WhatScreen,
    Age: AgeScreen,
    Symptoms: SymptomsScreen,
    Ineligible: IneligibleScreen,
    Consent: ConsentScreen,
    Address: AddressScreen,
    Confirmation: ConfirmationScreen,
    PushNotifications: PushNotificationsScreen,
    Instructions: InstructionsScreen,
    ExtraInfo: ExtraInfoScreen,
  },
  {
    headerMode: "float",
    navigationOptions: ({ navigation }) => {
      return {
        header: null,
      };
    },
  }
);

const ReloadAppOnLanguageChange = withNamespaces("common")(connect()(Home));

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

  async _loadAssets() {
    await Promise.all([
      Font.loadAsync({
        UniSansRegular: require("./assets/fonts/UniSansRegular.otf"),
        "OpenSans-Regular": require("./assets/fonts/OpenSans-Regular.ttf"),
        "OpenSans-Bold": require("./assets/fonts/OpenSans-Bold.ttf"),
        "OpenSans-ExtraBold": require("./assets/fonts/OpenSans-Bold.ttf"),
        "OpenSans-SemiBold": require("./assets/fonts/OpenSans-SemiBold.ttf"),
      }),
    ]);

    this.setState({ appReady: true });
  }

  render() {
    return this.state.appReady ? (
      <I18nextProvider i18n={i18n}>
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
