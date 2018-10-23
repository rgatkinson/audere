import "./src/hacks";
import React from "react";
import { createDrawerNavigator, createStackNavigator, NavigationScreenProp } from "react-navigation";
import { logInteraction } from "./src/EventStore";
import AccountScreen from "./src/ui/screens/AccountScreen";
import ComponentLibraryScreen from "./src/ui/screens/ComponentLibraryScreen";
import LoginScreen from "./src/ui/screens/LoginScreen";
import ScreeningScreen from "./src/ui/screens/ScreeningScreen";
import SymptomsScreen from "./src/ui/screens/SymptomsScreen";
import DemographicsScreen from "./src/ui/screens/DemographicsScreen";
import HouseholdScreen from "./src/ui/screens/HouseholdScreen";
import IllnessHistoryScreen from "./src/ui/screens/IllnessHistoryScreen";
import ConsentScreen from "./src/ui/screens/ConsentScreen";
import { store, persistor, StoreState } from "./src/store/";
import { Provider, connect } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { I18nextProvider, withNamespaces } from "react-i18next";
import i18n from "./src/I18n";

let x = 1;
export function interact(data: string): Promise<void> {
  return logInteraction(data, x++);
}

const routes = {
  Account: AccountScreen,
  Screening: ScreeningScreen,
  Symptoms: SymptomsScreen,
  Demographics: DemographicsScreen,
  Household: HouseholdScreen,
  IllnessHistory: IllnessHistoryScreen,
  Consent: ConsentScreen,
};

export function goToNextScreen(navigation: NavigationScreenProp<any, any>) {
  const currentRoute = navigation.state.routeName;
  const routeNames = Object.keys(routes);
  const currentRouteIndex = routeNames.indexOf(currentRoute);
  if (currentRouteIndex > -1 && currentRouteIndex < routeNames.length - 1) {
    const nextRoute = routeNames[currentRouteIndex + 1];
    navigation.navigate(nextRoute);
  }
}

const MainStack = createStackNavigator(routes);
const LoginStack = createStackNavigator({ Login: LoginScreen });
const Drawer = createDrawerNavigator({
  Main: { screen: MainStack },
  ComponentLibrary: { screen: ComponentLibraryScreen },
});

const Root = connect((state: StoreState) => ({
  isLoggedIn: state.user !== null,
}))(
  (props: { isLoggedIn: boolean }) =>
    props.isLoggedIn ? (
      <Drawer screenProps={{ t: i18n.getFixedT() }} />
    ) : (
      <LoginStack screenProps={{ t: i18n.getFixedT() }} />
    )
);

const ReloadAppOnLanguageChange = withNamespaces("common", {
  bindI18n: "languageChanged",
  bindStore: false,
})(Root);

export default class App extends React.Component {
  render() {
    return (
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <ReloadAppOnLanguageChange />
          </PersistGate>
        </Provider>
      </I18nextProvider>
    );
  }
}
