import React from "react";
import { Alert } from "react-native";
import { connect } from "react-redux";
import { Action } from "../../../store";
import { NavigationScreenProp } from "react-navigation";
import Button from "./components/Button";
import ContentContainer from "./components/ContentContainer";
import Description from "./components/Description";
import ScreenContainer from "./components/ScreenContainer";
import StatusBar from "./components/StatusBar";
import Title from "./components/Title";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

@connect()
export default class SwabScreen extends React.Component<Props> {
  _onDone = () => {
    // TODO: store answer
    // TODO: does answer affect later logic?
    this.props.navigation.push("Blood");
  };

  _onNone = () => {
    Alert.alert(
      "Exit Survey?",
      "At least 1 nasal swab is required to participate in the study.",
      [
        {
          text: "Exit",
          onPress: () => {
            this.props.navigation.push("Inelligible");
          },
          style: "destructive",
        },
        { text: "Continue", onPress: () => {} },
      ]
    );
  };

  render() {
    return (
      <ScreenContainer>
        <StatusBar
          canProceed={false}
          progressNumber="60%"
          progressLabel="Enrollment"
          title="3. What symptoms have you experienced in..."
          onBack={() => this.props.navigation.pop()}
          onForward={this._onDone}
        />
        <ContentContainer>
          <Title label="4. Would you like to take part in an extra part of the study?" />
          <Description content="There is an extra part of the study. You have the choice to join this extra part. If you join this extra part, 2 nasal swabs would be collected from you. One collected by research staff. One collected by you." />
          <Button
            primary={true}
            enabled={true}
            label="Yes"
            subtext="I understand I will have 2 nasal swabs collected. One by me and the other by research staff."
            onPress={this._onDone}
          />
          <Button
            primary={true}
            enabled={true}
            label="No"
            subtext="I only want 1 nasal swab."
            onPress={this._onDone}
          />
          <Button
            primary={false}
            enabled={true}
            label="I do not want any nasal swabs collected."
            onPress={this._onNone}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}
