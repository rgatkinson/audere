import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Action, StoreState, setSymptoms } from "../../../store";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import Description from "../../components/Description";
import OptionList from "../../components/OptionList";
import ScreenContainer from "../../components/ScreenContainer";
import StatusBar from "../../components/StatusBar";
import Title from "../../components/Title";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
  age: number;
  symptoms?: Map<string, boolean>;
}

@connect((state: StoreState) => ({
  age: state.form!.age,
  symptoms: state.form!.symptoms,
}))
export default class SymptomsScreen extends React.PureComponent<Props> {
  symptoms = [
    "feelingFeverish",
    "headaches",
    "cough",
    "diarrhea",
    "soreThroat",
    "nauseaOrVomiting",
    "runnyOrStuffyNose",
    "rash",
    "fatigue",
    "muscleOrBodyAches",
    "increasedTroubleBreathing",
    "earPainOrDischarge",
  ];

  _onDone = () => {
    if (this._numSymptoms() > 1) {
      if (!isNaN(this.props.age) && this.props.age < 18) {
        this.props.navigation.push("Consent");
      } else {
        this.props.navigation.push("Swab");
      }
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
