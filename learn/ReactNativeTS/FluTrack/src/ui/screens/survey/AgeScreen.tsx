import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Action, StoreState, setAge, setMonths } from "../../../store";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import Description from "../../components/Description";
import NumberInput from "../../components/NumberInput";
import ScreenContainer from "../../components/ScreenContainer";
import StatusBar from "../../components/StatusBar";
import Title from "../../components/Title";

interface Props {
  age: number;
  months: number;
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

@connect((state: StoreState) => ({
  age: state.form!.age,
  months: state.form!.months,
}))
export default class AgeScreen extends React.Component<Props> {
  monthInput = React.createRef<NumberInput>();

  _onDone = () => {
    this.props.navigation.push("Symptoms");
  };

  render() {
    return (
      <ScreenContainer>
        <StatusBar
          canProceed={!!this.props.age || !!this.props.months}
          progressNumber="20%"
          progressLabel="Enrollment"
          title="1. Welcome to the Seattle Flu Study"
          onBack={() => this.props.navigation.pop()}
          onForward={this._onDone}
        />
        <ContentContainer>
          <Title label="2. What is the age of the participant?" />
          <NumberInput
            autoFocus={true}
            placeholder="Number of years"
            returnKeyType="done"
            value={this.props.age ? this.props.age + "" : undefined}
            onChange={text => {
              this.props.dispatch(setAge(parseInt(text)));
            }}
            onSubmit={() => {
              if (this.props.age < 1) {
                this.monthInput.current!.focus();
              } else if (this.props.age) {
                this._onDone();
              }
            }}
          />
          <Description content="If the participant is an infant less than one year of age, how many months old are they?" />
          <NumberInput
            placeholder="Number of months"
            ref={this.monthInput}
            returnKeyType="done"
            value={this.props.months ? this.props.months + "" : undefined}
            onChange={text => this.props.dispatch(setMonths(parseInt(text)))}
            onSubmit={this._onDone}
          />
          <Button
            enabled={!!this.props.age || !!this.props.months}
            primary={true}
            label="Done"
            onPress={this._onDone}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}
