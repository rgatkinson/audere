import React from "react";
import StyledButton from "./StyledButton";
import CheckBox from "./CheckBox";
import ScreenView from "./ScreenView";
import MyText from "./MyText";
import { interact } from "../../App";
import { connect } from "react-redux";
import { NavigationScreenProp } from "react-navigation";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  onNext: string;
  age: number;
}
function mapStateToProps(state: any) {
  return {
    age: state.age,
  };
}
class SymptomsScreen extends React.Component<Props, any> {
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
        <MyText size="heading">Symptoms</MyText>
        <MyText>Please check the symptoms you are experiencing today:</MyText>
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
        <StyledButton
          title="NEXT"
          onPress={() => {
            interact(JSON.stringify(this.state));
            this.props.navigation.navigate(this.props.onNext);
          }}
        />
      </ScreenView>
    );
  }
}

export default connect(mapStateToProps)(SymptomsScreen);
