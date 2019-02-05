import "./src/hacks";
import React from "react";
import { StatusBar, YellowBox } from "react-native";
YellowBox.ignoreWarnings([
  "Class EXHomeModule",
  "Class EXTest",
  "Class EXDisabledDevMenu",
  "Class EXDisabledRedBox",
]);
import { createStackNavigator, NavigationScreenProp } from "react-navigation";
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
import {
  Welcome,
  Why,
  What,
  Age,
  Symptoms,
  AddressScreen,
  Ineligible,
  Confirmation,
  PushNotifications,
  Instructions,
  ExtraInfo,
} from "./src/ui/Screens";
import ConsentScreen from "./src/ui/ConsentScreen";

const Home = createStackNavigator(
  {
    Welcome,
    Why,
    What,
    Age,
    Symptoms,
    Ineligible,
    Consent: ConsentScreen,
    Address: AddressScreen,
    Confirmation,
    PushNotifications,
    Instructions,
    ExtraInfo,
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
