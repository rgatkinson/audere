import "./src/hacks";
import React from "react";
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
import BloodScreen from "./src/ui/screens/survey/BloodScreen";
import ConsentScreen from "./src/ui/screens/survey/ConsentScreen";
import HipaaScreen from "./src/ui/screens/survey/HipaaScreen";
import AssentScreen from "./src/ui/screens/survey/AssentScreen";
import BloodConsentScreen from "./src/ui/screens/survey/BloodConsentScreen";
import EnrolledScreen from "./src/ui/screens/survey/EnrolledScreen";
import InelligibleScreen from "./src/ui/screens/survey/InelligibleScreen";
import PaperConsentScreen from "./src/ui/screens/survey/PaperConsentScreen";
import SurveyStartScreen from "./src/ui/screens/survey/SurveyStartScreen";
import SurveyScreen from "./src/ui/screens/survey/SurveyScreen";
import PassBackScreen from "./src/ui/screens/survey/PassBackScreen";

const Home = createStackNavigator(
  {
    Welcome: WelcomeScreen,
    Why: WhyScreen,
    What: WhatScreen,
    Age: AgeScreen,
    Symptoms: SymptomsScreen,
    Blood: BloodScreen,
    Consent: ConsentScreen,
    Hipaa: HipaaScreen,
    Assent: AssentScreen,
    BloodConsent: BloodConsentScreen,
    Inelligible: InelligibleScreen,
    Enrolled: EnrolledScreen,
    PaperConsent: PaperConsentScreen,
    SurveyStart: SurveyStartScreen,
    Survey: SurveyScreen,
    PassBack: PassBackScreen,
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
