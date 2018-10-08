import React from "react";
import { Text, View, Alert } from "react-native";
import StyledButton from "./StyledButton";
import ScreenView from "./ScreenView";
import MyText from "./MyText";
import { interact } from "../../App";
var styles = require("../Styles.ts");
import consentForm from "../resources/consentForm.json";

export default class ConsentScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      consent: "true"
    };
  }
  render() {
    return (
      <ScreenView>
        <MyText>
          Please read the following and click "I Agree" if you agree to the
          terms of the study.
          {"\n"}
          {"\n"}
        </MyText>
        <View style={styles.whiteBackground}>
          <Text>{consentForm.content}</Text>
        </View>
        <StyledButton
          title="I AGREE"
          onPress={() => {
            interact(JSON.stringify(this.state));
            Alert.alert(
              "Thank you for participating. Your info has been submitted."
            );
          }}
        />
      </ScreenView>
    );
  }
}
