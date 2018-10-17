import React from "react";
// import { Alert } from "react-native";
import { createStackNavigator, NavigationScreenProp } from "react-navigation";
import { logInteraction } from "./src/EventStore";
import LoginScreen from "./src/components/LoginScreen";
import ScreeningScreen from "./src/components/ScreeningScreen";
import SymptomsScreen from "./src/components/SymptomsScreen";
import DemographicsScreen from "./src/components/DemographicsScreen";
import HouseholdScreen from "./src/components/HouseholdScreen";
import IllnessHistoryScreen from "./src/components/IllnessHistoryScreen";
import ConsentScreen from "./src/components/ConsentScreen";
import { store } from "./src/store/";
import { Provider, connect } from "react-redux";

let x = 1;
export function interact(data: string): Promise<void> {
  return logInteraction(data, x++);
}

const routes = {
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

const Root = connect(state => ({
  isLoggedIn: state.user !== null,
}))(props => (props.isLoggedIn ? <MainStack /> : <LoginStack />));

export default class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <Root />
      </Provider>
    );
  }
}
