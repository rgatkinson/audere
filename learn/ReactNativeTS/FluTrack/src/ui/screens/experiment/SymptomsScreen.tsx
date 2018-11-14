import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { StoreState } from "../../../store/index";
import { Action, setSymptoms } from "../../../store";
import Button from "./components/Button";
import ContentContainer from "./components/ContentContainer";
import Description from "./components/Description";
import OptionList from "./components/OptionList";
import ScreenContainer from "./components/ScreenContainer";
import StatusBar from "./components/StatusBar";
import Title from "./components/Title";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
  symptoms?: Map<string, boolean>;
}

@connect((state: StoreState) => ({ symptoms: state.form!.symptoms }))
export default class SymptomsScreen extends React.PureComponent<Props> {
  symptoms = [
    "Feeling feverish",
    "Headaches",
    "Cough",
    "Diarrhea",
    "Sore Throat",
    "Nausea or vomiting",
    "Runny or stuffy nose",
    "Rash",
    "Fatigue (tiredness)",
    "Muscle or body aches",
    "Increased trouble with breathing",
    "Ear pain or ear discharge",
  ];

  _onDone = () => {
    if (this._numSymptoms() > 1) {
      this.props.navigation.push("Swab");
    } else {
      this.props.navigation.push("Inelligible");
    }
  };

  _numSymptoms = () => {
    return this.props.symptoms
      ? Array.from(this.props.symptoms.values()).reduce(
          (count, value) => (value ? count + 1 : count),
          0
        )
      : 0;
  };

  render() {
    return (
      <ScreenContainer>
        <StatusBar
          canProceed={this._numSymptoms() > 0}
          progressNumber="40%"
          progressLabel="Enrollment"
          title="2. What is the age of the participant?"
          onBack={() => this.props.navigation.pop()}
          onForward={this._onDone}
        />
        <ContentContainer>
          <Title label="3. What symptoms have you experienced in the last week?" />
          <Description content="Please select all that apply." center={true} />
          <OptionList
            data={
              this.props.symptoms
                ? this.props.symptoms
                : OptionList.emptyMap(this.symptoms)
            }
            multiSelect={true}
            numColumns={2}
            onChange={symptoms => this.props.dispatch(setSymptoms(symptoms))}
          />
          <Button
            enabled={this._numSymptoms() > 0}
            primary={true}
            label="Done"
            onPress={this._onDone}
          />
          <Button
            enabled={true}
            primary={false}
            label="None of the above"
            onPress={() => {
              this.props.dispatch(
                setSymptoms(OptionList.emptyMap(this.symptoms))
              );
              this.props.navigation.push("Inelligible");
            }}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}
