import React from "react";
import { Text, View, Alert, StyleSheet } from "react-native";
import Button from "./ui/Button";
import ScreenView from "./ScreenView";
import MyText from "./MyText";
import { interact } from "../../App";
import { CONSENT_FORM_TEXT } from "../resources/consentForm";

export default class ConsentScreen extends React.Component {
  state = {
    consent: true,
  };
  render() {
    return (
      <ScreenView>
        <MyText>
          Please read the following and click "I Agree" if you agree to the
          terms of the study.
        </MyText>
        <View style={styles.consentViewer}>
          <Text>{CONSENT_FORM_TEXT}</Text>
        </View>
        <Button
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

const styles = StyleSheet.create({
  consentViewer: {
    marginTop: 20,
    backgroundColor: "white",
  },
});
