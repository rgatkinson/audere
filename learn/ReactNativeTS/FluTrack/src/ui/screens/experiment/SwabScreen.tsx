import React from "react";
import { connect } from "react-redux";
import { Action } from "../../../store";
import { NavigationScreenProp } from "react-navigation";
import Button from './components/Button';
import ContentContainer from "./components/ContentContainer";
import Description from './components/Description';
import ScreenContainer from './components/ScreenContainer';
import StatusBar from './components/StatusBar';
import Title from './components/Title';

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

@connect()
export default class SwabScreen extends React.Component<Props> {

  _onDone= () => {
    // TODO: store answer
    // TODO: does answer affect later logic?
    this.props.navigation.push('Blood');
  }

  render() {
    return (
      <ScreenContainer>
        <StatusBar
          canProceed={false}
          progressPercent={60}
          title='3. What symptoms have you experienced in...'
          onBack={() => this.props.navigation.pop()}
          onForward={this._onDone}
        />
        <ContentContainer>
          <Title label="4. Would you be willing to collect a nasal swab yourself?" />
          <Description
            content="As part of this study, we would like to compare results between swabs that participants administer themselves versus swabs administered by clinical staff. Would you be willing to have two swabs performed, one which you would perform on yourself, and one that a member of our clinical staff will collect?" />
          <Button
            primary={true}
            enabled={true}
            label="Yes"
            subtext="I am willing to have two swabs taken."
            onPress={this._onDone}
          />
          <Button
            primary={true}
            enabled={true}
            label="No"
            subtext="I want to have one swab, administered by clinical staff."
            onPress={this._onDone}
          />
          <Button
            primary={false}
            enabled={true}
            label="I do not want to be swabbed at all"
            onPress={this._onDone}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}
