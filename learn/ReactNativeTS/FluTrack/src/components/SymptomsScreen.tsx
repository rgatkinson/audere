import React from "react";
import StyledButton from "./StyledButton";
import CheckBox from "react-native-check-box";
import ScreenView from "./ScreenView";
import MyText from "./MyText";
import { interact } from "../../App";
var styles = require("../Styles.ts");

export default class SymptomsScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fever: false,
      cough: false,
      wheezing: false,
      muscleAche: false,
      shortnessOfBreath: false,
      troubleBreathing: false,
      mucous: false,
      earPain: false
    };
  }
  render() {
    return (
      <ScreenView>
        <MyText style={styles.headingText}>Symptoms</MyText>
        <MyText style={{ width: 300 }}>
          Please check the symptoms you are experiencing today
        </MyText>
        <CheckBox
          style={styles.checkbox}
          onClick={() => {
            this.setState({
              fever: !this.state.fever
            });
          }}
          isChecked={this.state.fever}
          rightText={"Fever"}
        />
        <CheckBox
          style={styles.checkbox}
          onClick={() => {
            this.setState({
              cough: !this.state.cough
            });
          }}
          isChecked={this.state.cough}
          rightText={"New or worsening cough"}
        />
        <CheckBox
          style={styles.checkbox}
          onClick={() => {
            this.setState({
              wheezing: !this.state.wheezing
            });
          }}
          isChecked={this.state.wheezing}
          rightText={"Wheezing"}
        />
        <CheckBox
          style={styles.checkbox}
          onClick={() => {
            this.setState({
              muscleAche: !this.state.muscleAche
            });
          }}
          isChecked={this.state.muscleAche}
          rightText={"Muscle ache"}
        />
        <CheckBox
          style={styles.checkbox}
          onClick={() => {
            this.setState({
              shortnessOfBreath: !this.state.shortnessOfBreath
            });
          }}
          isChecked={this.state.shortnessOfBreath}
          rightText={"Shortness of breath (increased or new)"}
        />
        <CheckBox
          style={styles.checkbox}
          onClick={() => {
            this.setState({
              troubleBreathing: !this.state.troubleBreathing
            });
          }}
          isChecked={this.state.troubleBreathing}
          rightText={"Trouble with or fast breathing"}
        />
        <CheckBox
          style={styles.checkbox}
          onClick={() => {
            this.setState({
              mucous: !this.state.mucous
            });
          }}
          isChecked={this.state.mucous}
          rightText={"New mucous or phlegm production"}
        />
        <CheckBox
          style={styles.checkbox}
          onClick={() => {
            this.setState({
              earPain: !this.state.earPain
            });
          }}
          isChecked={this.state.earPain}
          rightText={"Ear pain or ear discharge"}
        />
        <StyledButton
          title="NEXT"
          onPress={() => {
            interact(JSON.stringify(this.state));
            this.props.navigation.navigate("Demographics");
          }}
        />
      </ScreenView>
    );
  }
}
