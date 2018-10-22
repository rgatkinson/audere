import React from "react";
import { View, Alert, StyleSheet } from "react-native";
import Button from "../components/Button";
import ScreenView from "../components/ScreenView";
import Text from "../components/Text";
import { interact } from "../../../App";
import { CONSENT_FORM_TEXT } from "../../resources/consentForm";
import { NavigationScreenProp } from "react-navigation";

interface Props {
  navigation: NavigationScreenProp<void>;
}

export default class ConsentScreen extends React.Component<Props> {
  static navigationOptions = {
    title: "Consent Form",
  };

  state = {
    consent: true,
  };

  render() {
    return (
      <ScreenView>
        <Text>
          Please read the following and click "I Agree" if you agree to the
          terms of the study.
        </Text>
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
            this.props.navigation.popToTop();
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
