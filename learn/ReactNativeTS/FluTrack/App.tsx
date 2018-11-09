import "./src/hacks";
import React from "react";
import {
  createDrawerNavigator,
  createStackNavigator,
  NavigationScreenProp,
} from "react-navigation";
import { AppLoading, Font } from "expo";
import AboutScreen from "./src/ui/screens/AboutScreen";
import { store, persistor, StoreState } from "./src/store/";
import { Provider, connect } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { I18nextProvider, withNamespaces } from "react-i18next";
import { createUploader } from "./src/transport";
import i18n from "./src/i18n";

import HomeScreen from "./src/ui/screens/experiment/HomeScreen";
import WelcomeScreen from "./src/ui/screens/experiment/WelcomeScreen";
import AgeScreen from "./src/ui/screens/experiment/AgeScreen";
import SymptomsScreen from "./src/ui/screens/experiment/SymptomsScreen";
import SwabScreen from "./src/ui/screens/experiment/SwabScreen";
import BloodScreen from "./src/ui/screens/experiment/BloodScreen";
import ConsentScreen from "./src/ui/screens/experiment/ConsentScreen";
import EnrolledScreen from "./src/ui/screens/experiment/EnrolledScreen";
import InelligibleScreen from "./src/ui/screens/experiment/InelligibleScreen";
import HeaderBar from "./src/ui/screens/experiment/components/HeaderBar";
import SurveyStartScreen from "./src/ui/screens/experiment/SurveyStartScreen";
import SurveyScreen from "./src/ui/screens/experiment/SurveyScreen";
import PassBackScreen from "./src/ui/screens/experiment/PassBackScreen";

import SettingsScreen from "./src/ui/screens/admin/SettingsScreen";
import PriorScreen from "./src/ui/screens/admin/PriorScreen";

const uploader = createUploader();
export function interact(data: string): void {
  console.warn("Use uploader.save() instead of App.interact()");
  uploader.save("remove-me", { data });
}

const MainStack = createStackNavigator(
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
    navigationOptions: ({ navigation }) => ({
      header: <HeaderBar navigation={navigation} />,
    }),
  }
);

const AdminStack = createStackNavigator(
  {
    Settings: SettingsScreen,
    Prior: PriorScreen,
  },
  {
    mode: "modal",
    headerMode: "float",
  }
);

const Drawer = createDrawerNavigator({
  MainStack,
  About: { screen: AboutScreen },
  AdminStack,
});

const Root = connect((state: StoreState) => ({}))(() => (
  <Drawer screenProps={{ t: i18n.getFixedT(), uploader: createUploader() }} />
));

const ReloadAppOnLanguageChange = withNamespaces("common")(Root);

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
