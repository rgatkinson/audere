// Declare external modules here so that TS noImplicitAny does not give errors

declare module "redux-persist-transform-immutable";
declare module "react-native-simple-radio-button";
declare module "react-native-check-box";
declare module "react-native-datepicker";
declare module "react-native-keyboard-listener";
declare module "react-redux";
declare module "expo";
declare module "i18next";
declare module "expo-pixi";
declare module "crypto-pouch";
declare module "hybrid-crypto-js";

// pouch-crypto extension
namespace PouchDB {
  interface Database {
    crypto(password: string): void;
  }
}
