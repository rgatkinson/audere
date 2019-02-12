import React from "react";
import { createDrawerNavigator, createStackNavigator } from "react-navigation";
import {
  Welcome,
  Why,
  What,
  Age,
  Symptoms,
  AddressScreen,
  SymptomsIneligible,
  Consent,
  ConsentIneligible,
  Confirmation,
  PushNotifications,
  Instructions,
  ExtraInfo,
} from "./screens/ScreeningScreens";
import {
  WelcomeBack,
  WhatsNext,
  Before,
  ScanInstructions,
  Scan,
  ScanConfirmation,
  ManualEntry,
  ManualConfirmation,
  TestInstructions,
  Components,
  Swab,
  SwabPrep,
  Mucus,
} from "./screens/SurveyScreens";
import AboutScreen from "./screens/AboutScreen";
import SplashScreen from "./screens/SplashScreen";

const Home = createStackNavigator(
  {
    SplashScreen,
    Welcome,
    Why,
    What,
    Age,
    Symptoms,
    SymptomsIneligible,
    Consent,
    ConsentIneligible,
    Address: AddressScreen,
    Confirmation,
    PushNotifications,
    Instructions,
    ExtraInfo,
    WelcomeBack,
    WhatsNext,
    Before,
    ScanInstructions,
    Scan,
    ScanConfirmation,
    ManualEntry,
    ManualConfirmation,
    TestInstructions,
    Components,
    Swab,
    SwabPrep,
    Mucus,
  },
  {
    headerMode: "none",
  }
);

export default createDrawerNavigator({
  Home,
  About: { screen: AboutScreen },
});
