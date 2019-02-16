import { Alert } from "react-native";

export const findMedHelp = () => {
  Alert.alert("Hello", "Waiting on content", [
    { text: "Ok", onPress: () => {} },
  ]);
};

export const learnMore = () => {
  Alert.alert("Hello", "Waiting on content", [
    { text: "Ok", onPress: () => {} },
  ]);
};

export const scheduleUSPSPickUp = (next: any) => {
  Alert.alert("Hello", "Kick out to USPS site before proceeding", [
    {
      text: "Ok",
      onPress: () => {
        next();
      },
    },
  ]);
};

export const shareWithAFriend = () => {
  Alert.alert("Hello", "Waiting on content", [
    { text: "Ok", onPress: () => {} },
  ]);
};

export const showNearbyShippingLocations = () => {
  Alert.alert("Hello", "Waiting on content", [
    { text: "Ok", onPress: () => {} },
  ]);
};
