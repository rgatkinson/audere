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
import { store, persistor } from "./src/store/";
import { Provider, connect } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { I18nextProvider, withNamespaces } from "react-i18next";
import { Feather } from '@expo/vector-icons';
import i18n from "./src/i18n";

import HomeScreen from "./src/ui/screens/survey/HomeScreen";
import WelcomeScreen from "./src/ui/screens/survey/WelcomeScreen";
import AgeScreen from "./src/ui/screens/survey/AgeScreen";
import SymptomsScreen from "./src/ui/screens/survey/SymptomsScreen";
import BloodScreen from "./src/ui/screens/survey/BloodScreen";
import ConsentScreen from "./src/ui/screens/survey/ConsentScreen";
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
    ManualBarcode: ManualBarcodeScreen,
  },
  {
    mode: "modal",
    headerMode: "float",
  }
);

const tabBarVisible = (navigation: NavigationScreenProp<any, any>) => {
  const { routes } = navigation.state;
  return navigation.state.index === 0;
};

const FluStudy = createBottomTabNavigator(
  {
    Home,
    Admin,
  },
  {
    navigationOptions: ({ navigation }) => ({
      tabBarVisible: tabBarVisible(navigation),
      tabBarIcon: ({ focused, tintColor }) => {
        const { routeName } = navigation.state;
        const iconName = routeName === "Home" ? "home" : "settings";

        return (
          <Feather name={iconName} color={tintColor!} size={20} />
        );
      },
      tabBarLabel: i18n.t("common:tab:" + navigation.state.routeName),
    }),
  }
);

const Drawer = createDrawerNavigator({
  FluStudy,
  About: { screen: AboutScreen },
});

const ReloadAppOnLanguageChange = withNamespaces("common")(connect()(Drawer));

export default class App extends React.Component {
  state = {
    appReady: false,
  };

  componentWillMount() {
    this._loadAssets();
  }

  async _loadAssets() {
    await Font.loadAsync({
      UniSansRegular: require("./assets/fonts/UniSansRegular.otf"),
      "OpenSans-Regular": require("./assets/fonts/OpenSans-Regular.ttf"),
      "OpenSans-Bold": require("./assets/fonts/OpenSans-Bold.ttf"),
      "OpenSans-SemiBold": require("./assets/fonts/OpenSans-SemiBold.ttf"),
    });
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
