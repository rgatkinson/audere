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
import { createStackNavigator, NavigationScreenProp } from "react-navigation";
import { AppLoading, Font } from "expo";
import { getStore, getPersistor } from "./src/store/";
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
import {
  Welcome,
  Why,
  What,
  Age,
  Symptoms,
  AddressScreen,
  SymptomsIneligible,
  ConsentIneligible,
  Confirmation,
  PushNotifications,
  Instructions,
  ExtraInfo,
} from "./src/ui/ScreeningScreens";
import {
  WelcomeBack,
  WhatsNext,
  Before,
  ScanInstructions,
  Scan,
  ScanConfirmation,
  ManualEntry,
  TestOne,
} from "./src/ui/SurveyScreens";
import SplashScreen from "./src/ui/SplashScreen";
import ConsentScreen from "./src/ui/ConsentScreen";

const Home = createStackNavigator(
  {
    SplashScreen,
    Welcome,
    Why,
    What,
    Age,
    Symptoms,
    SymptomsIneligible,
    ConsentIneligible,
    Consent: ConsentScreen,
    Address: AddressScreen,
    Confirmation,
    PushNotifications,
    Instructions,
    ExtraInfo,
    WelcomeBack,
    WhatsNext,
    Before,
    ScanInstructions,
    Scan,
    ScanConfirmation,
    ManualEntry,
    TestOne,
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

  store?: Store;
  persistor?: Persistor;

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
