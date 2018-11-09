import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { connect } from "react-redux";
import { Action } from "../../../store";
import { CONSENT_FORM_TEXT } from "../../../resources/consentForm";
import { NavigationScreenProp } from "react-navigation";
import Button from "./components/Button";
import Description from "./components/Description";
import StatusBar from "./components/StatusBar";
import Title from "./components/Title";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

@connect()
export default class ConsentScreen extends React.Component<Props> {
  _onClear = () => {};

  _onSubmit = () => {
    // TODO: store answer
    // TODO: does answer affect later logic?
    // TODO: navigate to study
    this.props.navigation.push("Enrolled");
  };

  render() {
    return (
      <View style={styles.container}>
        <StatusBar
          canProceed={false}
          progressPercent={80}
          title="5. Would you be willing to participate..."
          onBack={() => this.props.navigation.pop()}
          onForward={this._onSubmit}
        />
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Title label="Consent" />
          <Description content="Thank you for assisting us with this study. Your informed consent is required for participation. Please read the following statements carefully. Then sign your acknowledgement below." />
          <Text>{CONSENT_FORM_TEXT}</Text>
          <View style={styles.buttonRow}>
            <Button
              enabled={true}
              label="Clear Signature"
              primary={false}
              onPress={this._onClear}
            />
            <Button
              enabled={true}
              label="Submit"
              primary={true}
              onPress={this._onSubmit}
            />
          </View>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    marginHorizontal: 20,
  },
  buttonRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
