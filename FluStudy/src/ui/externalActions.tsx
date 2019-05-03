import { Linking } from "react-native";

const scheduleUSPSUrl = "https://www.usps.com/pickup/";

export function scheduleUSPSPickUp(next: any) {
  Linking.openURL(scheduleUSPSUrl);
  next && next();
}
