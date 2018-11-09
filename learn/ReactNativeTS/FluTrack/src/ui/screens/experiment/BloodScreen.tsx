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
          progressPercent={70}
          title="4. Would you be willing to collect a nasal...?"
          onBack={() => this.props.navigation.pop()}
          onForward={this._onDone}
        />
        <ContentContainer>
          <Title label="5. Would you be willing to participate in the optional blood collection?" />
          <Description content="As part of this study, there is an optional blood sample collection. These samples will give us more information about your body's ability to fight infections." />
          <Button
            primary={true}
            enabled={true}
            label="Yes"
            subtext="I am willing to participate in the optional blood collection."
            onPress={this._onDone}
          />
          <Button
            primary={true}
            enabled={true}
            label="No"
            subtext="I do not want to participate in the optional blood collection. I only want to participate in the nasal swab collection."
            onPress={this._onDone}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}
