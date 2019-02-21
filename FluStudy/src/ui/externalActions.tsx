import { Alert, Linking, Platform } from "react-native";
import { AddressScreen } from "./screens/ScreeningScreens";
import { AddressConfig } from "../../src/resources/ScreenConfig";


const learnMoreUrl = "http://fluathome.org/";   // Site currently only supports http, not https
const scheduleUSPSUrl = "https://www.usps.com/pickup/";

function createMapQueryUrl(query: string) {
  const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
  const encodedQuery = encodeURIComponent(query);
  const url = `${scheme}${encodedQuery}`;

  return url;
}

export function findMedHelp() {
  Linking.openURL(createMapQueryUrl("urgent care clinic"));
};

export function learnMore() {
  Linking.openURL(learnMoreUrl);
};

export function scheduleUSPSPickUp(next: any) {
  Linking.openURL(scheduleUSPSUrl);
  next && next();
};

export function showNearbyShippingLocations(zipcode: string) {
  let linkUrl = `https://tools.usps.com/go/POLocatorAction!input.action?address=${zipcode}&radius=10&locationTypeQ=po`;

  Linking.openURL(linkUrl);
};
