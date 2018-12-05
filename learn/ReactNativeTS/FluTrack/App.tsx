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
import { Icon } from "react-native-elements";
import i18n from "./src/i18n";

import HomeScreen from "./src/ui/screens/survey/HomeScreen";
import WelcomeScreen from "./src/ui/screens/survey/WelcomeScreen";
import AgeScreen from "./src/ui/screens/survey/AgeScreen";
import SymptomsScreen from "./src/ui/screens/survey/SymptomsScreen";
import SwabScreen from "./src/ui/screens/survey/SwabScreen";
import BloodScreen from "./src/ui/screens/survey/BloodScreen";
import ConsentScreen from "./src/ui/screens/survey/ConsentScreen";
import EnrolledScreen from "./src/ui/screens/survey/EnrolledScreen";
import InelligibleScreen from "./src/ui/screens/survey/InelligibleScreen";
import HeaderBar from "./src/ui/components/HeaderBar";
import SurveyStartScreen from "./src/ui/screens/survey/SurveyStartScreen";
import SurveyScreen from "./src/ui/screens/survey/SurveyScreen";
import PassBackScreen from "./src/ui/screens/survey/PassBackScreen";

import SettingsScreen from "./src/ui/screens/admin/SettingsScreen";
import PriorScreen from "./src/ui/screens/admin/PriorScreen";
import SelectLocationScreen from "./src/ui/screens/admin/SelectLocationScreen";
import AdverseScreen from "./src/ui/screens/admin/AdverseScreen";
import AdverseDetailsScreen from "./src/ui/screens/admin/AdverseDetailsScreen";

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
    Swab: SwabScreen,
    Blood: BloodScreen,
    Consent: ConsentScreen,
    Inelligible: InelligibleScreen,
    Enrolled: EnrolledScreen,
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
    Adverse: AdverseScreen,
    AdverseDetails: AdverseDetailsScreen,
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
          <Icon name={iconName} color={tintColor!} size={20} type="feather" />
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
