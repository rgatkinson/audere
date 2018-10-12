// Common styles go here

import { StyleSheet } from "react-native";

export const colors = {
  accent: "#36b3a8" // Audere button color
};

export default StyleSheet.create({
  inputField: {
    width: 100,
    marginBottom: 10,
    backgroundColor: "#fff",
    paddingLeft: 5
  },
  wideInput: {
    width: 250,
    marginBottom: 10,
    backgroundColor: "#fff",
    paddingLeft: 5
  },
  datePicker: {
    width: 200,
    marginBottom: 10
  },
  errorBorder: {
    borderColor: "red",
    borderWidth: 3
  },
  formLayout: {
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "flex-start"
  }
});
