import React from "react";
import Button from "../components/Button";
import CheckBox from "../components/CheckBox";
import ScreenView from "../components/ScreenView";
import Text from "../components/Text";
import { goToNextScreen } from "../../../App";
import { connect } from "react-redux";
import { NavigationScreenProp } from "react-navigation";
import { StoreState } from "../../store";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  age: number;
}

@connect((state: StoreState) => ({ age: state.form!.age }))
export default class SymptomsScreen extends React.Component<Props, any> {
  static navigationOptions = {
    title: "Symptoms",
  };

  state = {
    fever: false,
    cough: false,
    wheezing: false,
    muscleAche: false,
    shortnessOfBreath: false,
    troubleBreathing: false,
    mucous: false,
    earPain: false,
  };
  render() {
    return (
      <ScreenView>
        <Text>Please check the symptoms you are experiencing today:</Text>
        <CheckBox
          onClick={() => {
            this.setState({
              fever: !this.state.fever,
            });
          }}
          isChecked={this.state.fever}
          text="Fever"
        />
        <CheckBox
          onClick={() => {
            this.setState({
              cough: !this.state.cough,
            });
          }}
          isChecked={this.state.cough}
          text="New or worsening cough"
        />
        <CheckBox
          onClick={() => {
            this.setState({
              wheezing: !this.state.wheezing,
            });
          }}
          isChecked={this.state.wheezing}
          text="Wheezing"
        />
        <CheckBox
          onClick={() => {
            this.setState({
              muscleAche: !this.state.muscleAche,
            });
          }}
          isChecked={this.state.muscleAche}
          text="Muscle ache"
        />
        <CheckBox
          onClick={() => {
            this.setState({
              shortnessOfBreath: !this.state.shortnessOfBreath,
            });
          }}
          isChecked={this.state.shortnessOfBreath}
          text="Shortness of breath (increased or new)"
        />
        <CheckBox
          onClick={() => {
            this.setState({
              troubleBreathing: !this.state.troubleBreathing,
            });
          }}
          isChecked={this.state.troubleBreathing}
          text="Trouble with or fast breathing"
        />
        <CheckBox
          onClick={() => {
            this.setState({
              mucous: !this.state.mucous,
            });
          }}
          isChecked={this.state.mucous}
          text="New mucous or phlegm production"
        />
        {this.props.age < 10 && (
          // This question only for children
          <CheckBox
            onClick={() => {
              this.setState({
                earPain: !this.state.earPain,
              });
            }}
            isChecked={this.state.earPain}
            text="Ear pain or ear discharge"
          />
        )}
        <Button
          title="NEXT"
          onPress={() => {
            goToNextScreen(this.props.navigation);
          }}
        />
      </ScreenView>
    );
  }
}
