// Common styles go here

import { StyleSheet } from "react-native";

export const colors = {
  accent: "#36b3a8" // Audere button color
};

export default StyleSheet.create({
  datePicker: {
    width: 200,
    marginBottom: 10
  },
  formLayout: {
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "flex-start"
  }
});
