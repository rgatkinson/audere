// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import "./src/hacks";
import React from "react";
import {
  createDrawerNavigator,
  createStackNavigator,
  createBottomTabNavigator,
  NavigationScreenProp,
} from "react-navigation";
import { AppLoading, Font } from "expo";
import AboutScreen from "./src/ui/screens/AboutScreen";
import BarcodesScreen from "./src/ui/screens/BarcodesScreen";
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
import { initializeFirebase } from "./src/util/firebase";

import HomeScreen from "./src/ui/screens/survey/HomeScreen";
import WelcomeScreen from "./src/ui/screens/survey/WelcomeScreen";
import AgeScreen from "./src/ui/screens/survey/AgeScreen";
import SymptomsScreen from "./src/ui/screens/survey/SymptomsScreen";
import BloodScreen from "./src/ui/screens/survey/BloodScreen";
import ConsentScreen from "./src/ui/screens/survey/ConsentScreen";
import HipaaScreen from "./src/ui/screens/survey/HipaaScreen";
import ResearcherEnglishHipaaScreen from "./src/ui/screens/survey/ResearcherEnglishHipaaScreen";
import AssentScreen from "./src/ui/screens/survey/AssentScreen";
import BloodConsentScreen from "./src/ui/screens/survey/BloodConsentScreen";
import EnrolledScreen from "./src/ui/screens/survey/EnrolledScreen";
import InelligibleScreen from "./src/ui/screens/survey/InelligibleScreen";
import HeaderBar from "./src/ui/components/HeaderBar";
import PaperConsentScreen from "./src/ui/screens/survey/PaperConsentScreen";
import SurveyStartScreen from "./src/ui/screens/survey/SurveyStartScreen";
import SurveyScreen from "./src/ui/screens/survey/SurveyScreen";
import PassBackScreen from "./src/ui/screens/survey/PassBackScreen";

import SettingsScreen from "./src/ui/screens/admin/SettingsScreen";
import PriorScreen from "./src/ui/screens/admin/PriorScreen";
import SelectLocationScreen from "./src/ui/screens/admin/SelectLocationScreen";
import SelectAdminScreen from "./src/ui/screens/admin/SelectAdminScreen";
import AdverseScreen from "./src/ui/screens/admin/AdverseScreen";
import AdverseDetailsScreen from "./src/ui/screens/admin/AdverseDetailsScreen";
import SpecimenScreen from "./src/ui/screens/admin/SpecimenScreen";
import ManualBarcodeScreen from "./src/ui/screens/admin/ManualBarcodeScreen";
import GiftCardScreen from "./src/ui/screens/admin/GiftCardScreen";
import GiftCardTypeScreen from "./src/ui/screens/admin/GiftCardTypeScreen";
import ManualGiftCardScreen from "./src/ui/screens/admin/ManualGiftCardScreen";

const Home = createStackNavigator(
  {
    Home: {
      screen: HomeScreen,
      navigationOptions: {
        header: null,
      },
    },
    Welcome: WelcomeScreen,
    Age: AgeScreen,
    Symptoms: SymptomsScreen,
    Blood: BloodScreen,
    Consent: ConsentScreen,
    Hipaa: HipaaScreen,
    ResearcherEnglishHipaa: ResearcherEnglishHipaaScreen,
    Assent: AssentScreen,
    BloodConsent: BloodConsentScreen,
    Inelligible: InelligibleScreen,
    Enrolled: EnrolledScreen,
    PaperConsent: PaperConsentScreen,
    SurveyStart: SurveyStartScreen,
    Survey: SurveyScreen,
    PassBack: {
      screen: PassBackScreen,
      navigationOptions: ({
        navigation,
      }: {
        navigation: NavigationScreenProp<any, any>;
      }) => ({
        header: <HeaderBar navigation={navigation} completedSurvey={true} />,
      }),
    },
  },
  {
    mode: "modal",
    headerMode: "float",
    navigationOptions: ({ navigation }) => {
      return {
        header: <HeaderBar navigation={navigation} />,
      };
    },
  }
);

const Admin = createStackNavigator(
  {
    Settings: SettingsScreen,
    Prior: PriorScreen,
    SelectLocation: SelectLocationScreen,
    SelectAdmin: SelectAdminScreen,
    Adverse: AdverseScreen,
    AdverseDetails: AdverseDetailsScreen,
    Specimen: SpecimenScreen,
    GiftCardType: GiftCardTypeScreen,
    GiftCard: GiftCardScreen,
    ManualBarcode: ManualBarcodeScreen,
    ManualGiftCard: ManualGiftCardScreen,
  },
  {
    mode: "modal",
    headerMode: "float",
  }
);

const AdminDrawer = createDrawerNavigator({
  Admin,
  About: { screen: AboutScreen },
  Barcodes: { screen: BarcodesScreen },
});

const tabBarVisible = (navigation: NavigationScreenProp<any, any>) => {
  const { routes } = navigation.state;
  return navigation.state.index === 0;
};

const FluStudy = createBottomTabNavigator(
  {
    Home: Home,
    Admin: AdminDrawer,
  },
  {
    navigationOptions: ({ navigation }) => ({
      tabBarVisible: tabBarVisible(navigation),
      tabBarIcon: ({ focused, tintColor }) => {
        const { routeName } = navigation.state;
        const iconName = routeName === "Home" ? "home" : "settings";

        return <Feather name={iconName} color={tintColor!} size={20} />;
      },
      tabBarLabel: i18n.t("common:tab:" + navigation.state.routeName),
    }),
  }
);

const ReloadAppOnLanguageChange = withNamespaces("common")(connect()(FluStudy));

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
    initializeFirebase();
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
