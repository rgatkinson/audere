// Common styles go here

import { StyleSheet } from "react-native";

export const colors = {
  accent: "#36b3a8" // Audere button color
};

export default StyleSheet.create({
  scrollView: {
    flex: 1,
    marginTop: 60,
    paddingLeft: 5,
    paddingRight: 5
  },
  screenView: {
    alignItems: "center",
    justifyContent: "center"
  },
  checkbox: {
    padding: 10,
    width: 300
  },
  picker: {
    height: 50,
    width: 300
  },
  slider: {
    height: 100,
    width: 300
  },
  inputField: {
    width: 100,
    marginBottom: 10,
    backgroundColor: "#fff",
    paddingLeft: 5
  },
  fieldLabel: {
    width: 100
  },
  titleText: {
    fontSize: 30,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 6,
    padding: 20
  },
  regularText: {
    fontSize: 15
  },
  largeText: {
    fontSize: 24
  },
  styledButton: {
    margin: 8,
    padding: 18,
    backgroundColor: colors.accent,
    borderRadius: 20,
    borderWidth: 0,
    height: 45,
    justifyContent: "center"
  },
  headingText: {
    fontSize: 18,
    padding: 15
  },
  bold: {
    fontWeight: "bold"
  },
  white: {
    color: "white"
  },
  consentViewer: {
    marginTop: 20,
    backgroundColor: "white"
  },
  wideInput: {
    width: 250,
    marginBottom: 10,
    backgroundColor: "#fff",
    paddingLeft: 5
  },
  flexRow: {
    flexDirection: "row",
    justifyContent: "flex-start"
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
