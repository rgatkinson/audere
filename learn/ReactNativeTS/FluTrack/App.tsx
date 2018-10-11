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

const RootStack = createStackNavigator(
  {
    Login: {
      screen: (props: any) => <LoginScreen {...props} onNext="Screening" />
    },
    Screening: {
      screen: (props: any) => <ScreeningScreen {...props} onNext="Symptoms" />
    },
    Symptoms: {
      screen: (props: any) => (
        <SymptomsScreen {...props} onNext="Demographics" />
      )
    },
    Demographics: {
      screen: (props: any) => (
        <DemographicsScreen {...props} onNext="Household" />
      )
    },
    Household: {
      screen: (props: any) => (
        <HouseholdScreen {...props} onNext="IllnessHistory" />
      )
    },
    IllnessHistory: {
      screen: (props: any) => (
        <IllnessHistoryScreen {...props} onNext="Consent" />
      )
    },
    Consent: ConsentScreen
  },
  {
    initialRouteName: "Login",
    navigationOptions: () => ({
      headerTransparent: true
    })
  }
);

export default class App extends React.Component {
  render() {
    return <RootStack />;
  }
}
