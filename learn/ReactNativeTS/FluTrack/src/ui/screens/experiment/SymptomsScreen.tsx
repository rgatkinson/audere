import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import Button from './components/Button';
import ContentContainer from "./components/ContentContainer";
import Description from './components/Description';
import OptionList from './components/OptionList';
import ScreenContainer from './components/ScreenContainer';
import StatusBar from './components/StatusBar';
import Title from './components/Title';

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

@connect()
export default class SymptomsScreen extends React.PureComponent<Props> {
  state = {
    selected: new Map<string, boolean>(),
  };

  symptoms = [
    'Feeling feverish',
    'Diarrhea',
    'Cough',
    'Nausea or vomiting',
    'Sore Throat',
    'Rash',
    'Runny or stuffy nose',
    'Muscle or body aches',
    'Fatigue (tiredness)',
    'Ear pain or ear discharge',
    'Increased trouble with breathing',
    'None of the above',
    'Headaches',
  ];

  _onDone= () => {
    // TODO don't count none of the above
    const numSymptoms = Array.from(this.state.selected.values())
      .reduce((count, value) => value ? count + 1 : count, 0);

    if (numSymptoms > 1) {
      this.props.navigation.push('Swab');
    } else {
      this.props.navigation.push('Inelligible');
    }
  }

  render() {
    // TODO: save symptoms in redux
    // TODO: only can proceed if an option is chosen
    return (
      <ScreenContainer>
        <StatusBar
          canProceed={true}
          progressPercent={40}
          title='2. What is the age of the participant?'
          onBack={() => this.props.navigation.pop()}
          onForward={this._onDone}
        />
        <ContentContainer>
          <Title label="3. What symptoms have you experienced in the last week?" />
          <Description content="Please select all that apply." />
          <OptionList
            data={this.symptoms}
            numColumns={2}
            onChange={(selected) => this.setState({selected})}
          />
          <Button
            enabled={true}
            primary={true}
            label="Done"
            onPress={this._onDone}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}
