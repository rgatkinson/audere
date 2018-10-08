import React from "react";
// import { Alert } from "react-native";
import { createStackNavigator } from "react-navigation";
import { logInteraction } from "./src/EventStore";
import LoginScreen from "./src/components/LoginScreen";
import ScreeningScreen from "./src/components/ScreeningScreen";
import SymptomsScreen from "./src/components/SymptomsScreen";
import DemographicsScreen from "./src/components/DemographicsScreen";
import HouseholdScreen from "./src/components/HouseholdScreen";
import IllnessHistoryScreen from "./src/components/IllnessHistoryScreen";
import ConsentScreen from "./src/components/ConsentScreen";

let x = 1;
export function interact(data: string): Promise<void> {
  return logInteraction(data, x++);
}

var styles = require("./src/Styles.ts");

const RootStack = createStackNavigator(
  {
    Login: LoginScreen,
    Screening: ScreeningScreen,
    Symptoms: SymptomsScreen,
    Demographics: DemographicsScreen,
    Household: HouseholdScreen,
    IllnessHistory: IllnessHistoryScreen,
    Consent: ConsentScreen
  },
  {
    initialRouteName: "Login"
  }
);

export default class App extends React.Component {
  render() {
    return <RootStack />;
  }
}
