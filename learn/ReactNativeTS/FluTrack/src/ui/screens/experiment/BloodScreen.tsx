import React from "react";
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
export default class BloodScreen extends React.Component<Props> {
  _onDone = () => {
    // TODO: store answer
    // TODO: does answer affect later logic?
    this.props.navigation.push("Consent");
  };

  render() {
    return (
      <ScreenContainer>
        <StatusBar
          canProceed={false}
          progressNumber="70%"
          progressLabel="Enrollment"
          title="4. Would you like to take part in an extra part of the..."
          onBack={() => this.props.navigation.pop()}
          onForward={this._onDone}
        />
        <ContentContainer>
          <Title label="5. Would you like to take part in a blood collection?" />
          <Description content="You have the choice to join an extra part of the study. If you join this extra part, we would collect a blood sample from you. To do this, we would poke your skin to collect blood from your vein." />
          <Button
            primary={true}
            enabled={true}
            label="Yes"
            subtext="I would like to join the extra part of the study. I understand I will have my blood collected."
            onPress={this._onDone}
          />
          <Button
            primary={true}
            enabled={true}
            label="No"
            subtext="I do not want any blood collected from me."
            onPress={this._onDone}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}
